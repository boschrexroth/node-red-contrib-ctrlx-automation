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
        'Authorization': token_type + ' ' + token
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


  /**
   * Read a value from the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} token_type - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to access.
   * @param {string} type - The type of information you want to read. Either 'data', 'metadata' or 'references'.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - After the read, the callback will be called.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static _readDatalayer(hostname, token_type, token, path, type, timeout, callback) {

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/automation/api/v1.0/' + path + '?type=' + type,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': token_type + ' ' + token
       },
      rejectUnauthorized: false   // accept self-signed certificates
    };

    if (timeout >= 0) {
      options.timeout = timeout;
    }

    const req = https.request(options, (res) => {
      let data = "";

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {

        // We expect 200 on success
        if (res.statusCode !== 200) {
          callback(CtrlxProblemError.fromHttpResponse(res, data));
          return;
        }

        // Try to parse the data
        let payload;
        try {
          payload = JSON.parse(data);
        } catch (err) {
          callback(err, null);
        }

        // No error, return payload data.
        callback(null, payload);
      });
    });

    req.on('timeout', () => {
      req.abort();
    });

    req.on('error', (err) => {
      callback(err);
    });

    req.end();
  }



  /**
   * Write a value to the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} token_type - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to access.
   * @param {object} data - The data to be written on the given path.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - After the read, the callback will be called.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static _writeDatalayer(hostname, token_type, token, path, data, timeout, callback) {

    var putData = JSON.stringify(data);

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/automation/api/v1.0/' + path,
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': token_type + ' ' + token,
        'Content-Length': putData.length
       },
      rejectUnauthorized: false   // accept self-signed certificates
    };

    if (timeout >= 0) {
      options.timeout = timeout;
    }

    const req = https.request(options, (res) => {
      let data = "";

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {

        // We expect 200 on success
        if (res.statusCode !== 200) {
          callback(CtrlxProblemError.fromHttpResponse(res, data));
          return;
        }

        // Try to parse the data
        let payload;
        try {
          payload = JSON.parse(data);
        } catch (err) {
          callback(err, null);
        }

        // No error, return payload data.
        callback(null, payload);
      });
    });

    req.on('timeout', () => {
      req.abort();
    });

    req.on('error', (err) => {
      callback(err);
    });

    req.write(putData);
    req.end();
  }




  /* ---------------------------------------------------------------------------
   * Public Methods
   * -------------------------------------------------------------------------*/

  get timeout() {
    return this._timeout;
  }

  set timeout(newTimeout) {
    this._timeout = newTimeout;
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
  readDatalayer(path) {

    return new Promise((resolve, reject) => {

      debug('readDatalayer()');

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
      CtrlxCore._readDatalayer(this._hostname,
        this._token_type,
        this._token,
        path,
        'data',
        this._timeout,
        function(err, data) {
            if (err) {
              debug('readDatalayer() ERROR');
              reject(err);
            } else {
              debug('readDatalayer() DONE');
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
      CtrlxCore._writeDatalayer(this._hostname,
        this._token_type,
        this._token, path,
        data,
        this._timeout,
        function(err, data) {
          if (err) {
            reject(err);
            debug('writeDatalayer() ERROR');
          } else {
            debug('writeDatalayer() DONE');
            resolve(data);
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

    return new Promise((resolve, reject) => {

      debug('readDatalayerMetadata()');

      // Check if we are logged in.
      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to read from Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.readDatalayerMetadata(path); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the read.
      CtrlxCore._readDatalayer(this._hostname,
        this._token_type,
        this._token,
        path,
        'metadata',
        this._timeout,
        function(err, data) {
          if (err) {
            debug('readDatalayerMetadata() ERROR');
            reject(err);
          } else {
            debug('readDatalayerMetadata() DONE');
            resolve(data);
          }
        });

    });
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

    return new Promise((resolve, reject) => {

      debug('readDatalayerReferences()');

      // Make sure we are logged in.
      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to read from Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.readDatalayerReferences(path); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the read.
      CtrlxCore._readDatalayer(this._hostname,
        this._token_type,
        this._token,
        path,
        'references',
        this._timeout,
        function(err, data) {
          if (err) {
            debug('readDatalayerReferences() ERROR');
            reject(err);
          } else {
            debug('readDatalayerReferences() DONE');
            resolve(data);
          }
        });

    });
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

    return new Promise((resolve, reject) => {

      debug('browseDatalayer()');

      // Make sure we are logged in.
      if (this._state != STATE_LOGGED_IN) {
        let err = new Error('Failed to browse the Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.browseDatalayer(path); })
          .then((result) => { resolve(result); })
          .catch((err)   => { reject(err); });

        return;
      }

      // Perform the read.
      CtrlxCore._readDatalayer(this._hostname,
        this._token_type,
        this._token,
        path,
        'browse',
        this._timeout,
        function(err, data) {
          if (err) {
            debug('browseDatalayer() ERROR');
            reject(err);
          } else {
            debug('browseDatalayer() DONE');
            resolve(data);
          }
        });

    });
  }

}

module.exports = CtrlxCore;

