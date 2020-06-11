/**
 * Copyright (c) 2020, Bosch Rexroth AG
 * All rights reserved.
 *
 * BSD-3-Clause
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict'

const https = require('https');
const net = require('net')
const atob = require('atob');
const debug = require('debug')('ctrlxcore');
const CtrlxDatalayer = require('./CtrlxDatalayer');
const CtrlxProblemError = require('./CtrlxProblemError');



const STATE_LOGGED_OUT = 0;
const STATE_LOGGED_IN = 1;
const STATE_AUTHENTICATING = 2;





/**
 * The CtrlxCore class provides different methods to access ctrlX CORE based device from Bosch Rexroth AG.
 * This includes for example methods to read or write to the ctrlX Data Layer.
 * Before you can make such a request to the device you need to authenticate by calling the logIn() method
 * and providing a username and password.
 * The class instance automatically caches the received session token.
 * After you are finished with your requests, don't forget to logOut() again.
 *
 * @example <caption>Example usage of CtrlxCore to read two values using promises.</caption>
 * let ctrlx = new CtrlxCore('[fe80::260:34ff:fe08:322]', 'boschrexroth', 'boschrexroth');
 *
 * ctrlx.logIn()
 *  .then(() => ctrlx.readDatalayer('framework/bundles/com_boschrexroth_comm_datalayer/active') )
 *  .then((data) => console.log(data))
 *  .then(() => ctrlx.readDatalayer('framework/metrics/system/cpu-utilisation-percent') )
 *  .then((data) => console.log(data))
 *  .catch((err) => console.error('Housten we are in trouble: ' + err))
 *  .finally(() => ctrlx.logOut());
 *
 *
*/
class CtrlxCore {


  /**
   * Creates an instance of CtrlxCore.
   *
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} username - The username to authenticate against.
   * @param {string} password - The password of the username.
   * @memberof CtrlxCore
   */
  constructor(hostname, username, password) {
    debug(`constructor(${hostname}, ...)`);
    this._hostname = hostname;
    this._username = username;
    this._password = password;
    this._token = undefined;
    this._token_type = undefined;
    this._token_decoded = undefined;
    this._token_expireTime = Date.now();
    this._state = STATE_LOGGED_OUT;
    this._timeout = -1;
    this._autoReconnect = false;
  }



  /* ---------------------------------------------------------------------------
   * Private Methods
   * -------------------------------------------------------------------------*/


  /**
   * This is a helper function do decode a JSON Web Token (JWT). See: https://jwt.io/
   * or https://de.wikipedia.org/wiki/JSON_Web_Token.
   *
   * Utility function taken from: https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library#
   *
   * @static
   * @param {string} token - JWT token string encoded in Base64Url to decode
   * @returns Returns an object with the decode JWT data.
   * @memberof CtrlxCore
   */
  static _parseJwt(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }


  /**
   * Authenticates against a ctrlX CORE and returns a token, that can be used for further https requests.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} username - The username to authenticate against.
   * @param {string} password - The password of the username.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - Returns the token data.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static _authenticate(hostname, username, password, timeout, callback) {

    // Authentication data is encoded and send as body.
    var postData = JSON.stringify({
      name: username,
      password: password
    });

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/identity-manager/api/v1/auth/token',
      method: 'POST',
      headers: {
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      rejectUnauthorized: false   // accept self-signed certificates
    };

    if (timeout >= 0) {
      options.timeout = timeout;
    }

    const req = https.request(options, (res) => {
      var data = "";

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {

        // We expect statusCode 201 if authentication was successfull.
        if (res.statusCode == 201) {
          callback(null, JSON.parse(data));
        } else {
          callback(CtrlxProblemError.fromHttpResponse(res, data), null);
        }
      });
    });

    req.on('timeout', () => {
      req.abort();
    });

    req.on('error', (err) => {
      callback(err);
    });

    req.write(postData);
    req.end();
  }


  /**
   * Delete the current token. Results in logout of the current username.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} token_type - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err) - After the read, the callback will be called.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static _deleteToken(hostname, token_type, token, timeout, callback) {

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/identity-manager/api/v1/auth/token',
      method: 'DELETE',
      headers: {
        'Authorization': token_type + ' ' + token,
        'Connection': 'keep-alive',
       },
      rejectUnauthorized: false   // accept self-signed certificates
    };

    if (timeout >= 0) {
      options.timeout = timeout;
    }

    const req = https.request(options, (res) => {

      // We expect statusCode 204 if token got destroyed successfully.
      if (res.statusCode == 204) {
        callback(null);
      } else {
        callback(CtrlxProblemError.fromHttpResponse(res, null));
      }

    });

    req.on('timeout', () => {
      req.abort();
    });

    req.on('error', (err) => {
      callback(err);
    });

    req.end();
  }


  /* ---------------------------------------------------------------------------
   * Public Methods
   * -------------------------------------------------------------------------*/


  /**
   * Timeout in milliseconds that is used for requests. Set to -1 if system defaults should be used.
   *
   * @memberof CtrlxCore
   */
  get timeout() {
    return this._timeout;
  }

  /**
   * Timeout in milliseconds that is used for requests. Set to -1 if system defaults should be used.
   *
   * @memberof CtrlxCore
   */
  set timeout(newTimeout) {
    this._timeout = newTimeout;
  }

  /**
   * If set to true, then an automatic reconnect will be tried if an authorization error has occured.
   *
   * @memberof CtrlxCore
   */
  get autoReconnect() {
    return this._autoReconnect;
  }

  /**
   * If set to true, then an automatic reconnect will be tried if an authorization error has occured.
   *
   * @memberof CtrlxCore
   */
  set autoReconnect(newAutoReconnect) {
    this._autoReconnect = newAutoReconnect;
  }

  /**
   * Login to ctrlX CORE and authenticate to create a session.
   *
   * @returns {Promise.<Object, Error>} A promise that returns an object with infos about the login token,
   *  or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  logIn() {

    return new Promise( (resolve, reject) => {

      debug(`logIn(${this._hostname})`);

      // If we are already logged in, then log out before we atempt a new login.
      if (this._state == STATE_LOGGED_IN || this._state == STATE_AUTHENTICATING) {

        this.logOut()
          // After we logged out, we login. Regardless if logout was done correct or not.
          .then(()       => {return this.logIn()},  ()    => {return this.logIn()})
          // Resolve the original promise with the result of the new login promise.
          .then((result) => {resolve(result);},     (err) => {reject(err);});
        return;
      }

      // Now login to the device
      this._state = STATE_AUTHENTICATING;

      CtrlxCore._authenticate(this._hostname, this._username, this._password, this._timeout, (err, data) => {

        // Any communication errors?
        if (err) {
          this._token = undefined;
          this._token_type = undefined;
          this._token_decoded = undefined;
          this._state = STATE_LOGGED_OUT;

          reject(err);
          return;
        }

        // Check if we got token data or if authentication failed?
        if (!data.access_token || !data.token_type) {
          this._token = undefined;
          this._token_type = undefined;
          this._token_decoded = undefined;
          this._state = STATE_LOGGED_OUT;

          reject(new Error('Did not receive expected data as authentication response'));
          return;
        }

        // Seems like we got the token. Let's decode the token data.
        try {
          this._token = data.access_token;
          this._token_type = data.token_type;
          this._state = STATE_LOGGED_IN;

          // Try to parse the token.
          this._token_decoded = data.token_decoded = CtrlxCore._parseJwt(data.access_token);

          // Calculate when this token will expire and take a few seconds buffer time into account.
          var tokenExpiresInSeconds = this._token_decoded.exp - this._token_decoded.iat - 30;
          this._token_expireTime = data.token_expireTime = Date.now().valueOf() + tokenExpiresInSeconds * 1000;

        } catch (error) {
          this._token = undefined;
          this._token_type = undefined;
          this._token_decoded = undefined;
          this._state = STATE_LOGGED_OUT;
          reject(error);
          return;
        }

        // we also return the token data to the caller.
        debug(`logIn() DONE, token will expire in ${tokenExpiresInSeconds} seconds at ${new Date(data.token_expireTime).toLocaleString()} local time `);
        resolve(data);
      });
    });

  }


  /**
   * Log out from ctrlX CORE to delete session.
   *
   * @returns {Promise.<null, Error>} A promise that returns nothing on success or an Error if rejected.
   * @memberof CtrlxCore
   */
  logOut() {

    return new Promise((resolve, reject) => {

      debug(`logOut(${this._hostname})`);

      CtrlxCore._deleteToken(this._hostname,
        this._token_type,
        this._token,
        this._timeout,
        (err) => {

          // Invalidate members regardless if logout was successfull or not.
          // There is no need anyway.
          this._token = undefined;
          this._token_type = undefined;
          this._token_decoded = undefined;
          this._state = STATE_LOGGED_OUT;

          if (err) {
            debug(`failed to delete token with error ${err.message}`);
            reject(err);
          } else {
            debug('logOut() DONE');
            resolve();
          }

        })

    });
  }


  /**
   * Read a data value from the ctrlX Data Layer.
   *
   * @param {string} path - The datalayer path, that you want to access.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  readDatalayer(path, type = 'data') {

    return new Promise((resolve, reject) => {

      debug(`readDatalayer(${type})`);

      // Throw an error if not yet logged in.
      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to read from Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.readDatalayer(path); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the read.
      CtrlxDatalayer.read(this._hostname,
        this._token_type,
        this._token,
        path,
        type,
        this._timeout,
        (err, data) => {
            if (err) {
              // If automatic reconnect is enabled, then we try one login attempt and then try again.
              if (err.status == 401 && this._autoReconnect) {
                debug(`readDatalayer(${type}) RECONNECT`);
                this.logIn().then(() => { return this.readDatalayer(path); })
                  .then((result) => { resolve(result); })
                  .catch((err)   => { reject(err); })
                  .finally(()    => { this._state = STATE_LOGGED_IN; });
              } else {
                debug(`readDatalayer(${type}) ERROR`);
                reject(err);
              }
            } else {
              debug(`readDatalayer(${type}) DONE`);
              resolve(data);
            }
        });

    });

  }


  /**
   * Write a data value to the ctrlX Data Layer.
   *
   * @param {string} path - The datalayer path, that you want to access.
   * @param {Object} data - The data to write.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  writeDatalayer(path, data) {

    return new Promise((resolve, reject) => {

      debug('writeDatalayer()');

      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to read from Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.writeDatalayer(path, data); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the write.
      CtrlxDatalayer.write(this._hostname,
        this._token_type,
        this._token, path,
        data,
        this._timeout,
        (err, dataReturned) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status == 401 && this._autoReconnect) {
              debug(`writeDatalayer() RECONNECT`);
              this.logIn().then(() => { return this.writeDatalayer(path, data); })
                .then((result) => { resolve(result); })
                .catch((err)   => { reject(err); })
                .finally(()    => { this._state = STATE_LOGGED_IN; });
            } else {
              reject(err);
              debug('writeDatalayer() ERROR');
            }
          } else {
            debug('writeDatalayer() DONE');
            resolve(dataReturned);
          }
        });

    });
  }


  /**
   * Read the metadata of a node from the ctrlX Data Layer.
   *
   * @param {string} path - The datalayer path, that you want to access.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  readDatalayerMetadata(path) {
    return this.readDatalayer(path, 'metadata');
  }


  /**
   * Read all references of a node from the ctrlX Data Layer.
   *
   * @param {string} path - The datalayer path, that you want to access.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  readDatalayerReferences(path) {
    return this.readDatalayer(path, 'references');
  }


  /**
   * Read all browsing information of a node from the ctrlX Data Layer.
   *
   * @param {string} path - The datalayer path, that you want to browse.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  browseDatalayer(path) {
    return this.readDatalayer(path, 'browse');
  }


  createDatalayer(path, data) {

    return new Promise((resolve, reject) => {

      debug('createDatalayer()');

      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to create node on Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new create promise to resolve the original promise.
        this.logIn().then(() => { return this.createDatalayer(path, data); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the create.
      CtrlxDatalayer.create(this._hostname,
        this._token_type,
        this._token, path,
        data,
        this._timeout,
        (err, dataReturned) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status == 401 && this._autoReconnect) {
              debug(`createDatalayer() RECONNECT`);
              this.logIn().then(() => { return this.createDatalayer(path, data); })
                .then((result) => { resolve(result); })
                .catch((err)   => { reject(err); })
                .finally(()    => { this._state = STATE_LOGGED_IN; });
            } else {
              reject(err);
              debug('createDatalayer() ERROR');
            }
          } else {
            debug('createDatalayer() DONE');
            resolve(dataReturned);
          }
        });

    });
  }


  deleteDatalayer(path) {

    return new Promise((resolve, reject) => {

      debug('deleteDatalayer()');

      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to delete node on Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new delete promise to resolve the original promise.
        this.logIn().then(() => { return this.deleteDatalayer(path); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the delete.
      CtrlxDatalayer.delete(this._hostname,
        this._token_type,
        this._token, path,
        this._timeout,
        (err) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status == 401 && this._autoReconnect) {
              debug(`deleteDatalayer() RECONNECT`);
              this.logIn().then(() => { return this.deleteDatalayer(path); })
                .then((result) => { resolve(result); })
                .catch((err)   => { reject(err); })
                .finally(()    => { this._state = STATE_LOGGED_IN; });
            } else {
              reject(err);
              debug('deleteDatalayer() ERROR');
            }
          } else {
            debug('deleteDatalayer() DONE');
            resolve();
          }
        });

    });
  }

}

module.exports = CtrlxCore;

