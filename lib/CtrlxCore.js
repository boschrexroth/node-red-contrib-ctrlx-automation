/**
 *
 * MIT License
 *
 * Copyright (c) 2020-2021 Bosch Rexroth AG
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
'use strict'

const https = require('https');
const net = require('net');
const atob = require('atob');
const debug = require('debug')('ctrlxcore');
const CtrlxDatalayer = require('./CtrlxDatalayerV2');
const CtrlxDatalayerSubscription = require('../lib/CtrlxDatalayerSubscription');
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
 *  .then(() => ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active') )
 *  .then((data) => debug(data))
 *  .then(() => ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent') )
 *  .then((data) => debug(data))
 *  .catch((err) => console.error('Housten we are in trouble: ' + err))
 *  .finally(() => ctrlx.logOut());
 *
 *
 * @example <caption>Example usage of CtrlxCore to read two values using async/await.</caption>
 * let ctrlx = new CtrlxCore('[fe80::260:34ff:fe08:322]', 'boschrexroth', 'boschrexroth');
 *
 * try {
 *   await ctrlx.logIn()
 *
 *   let data1 = await ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
 *   debug(data1);
 *
 *   let data2 = await ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent');
 *   debug(data2);
 *
 * } catch(err) {
 *   console.error('Housten we are in trouble: ' + err);
 * } finally {
 *   await ctrlx.logOut();
 * }
 *
 */
class CtrlxCore {


  /**
   * Creates an instance of CtrlxCore.
   *
   * @param {string} host - The host address of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   *                        Port is optional and defaults to 443 (https).
   * @param {string} username - The username to authenticate against.
   * @param {string} password - The password of the username.
   * @memberof CtrlxCore
   */
  constructor(host, username, password) {
    debug(`constructor(${host}, ...)`);

    let p = CtrlxCore._parseHost(host);
    this._hostname = p.hostname;
    this._port = p.port;
    this._username = username;
    this._password = password;
    this._token = undefined;
    this._tokenType = undefined;
    this._authorization = undefined;
    this._token_decoded = undefined;
    this._token_expireTime = Date.now();
    this._state = STATE_LOGGED_OUT;
    this._timeout = -1;
    this._autoReconnect = false;
    this._servername = (net.isIP(this._hostname) === 0) ? this._hostname : '';
    this._isIPv6 = net.isIPv6(this._hostname);
  }



  /* ---------------------------------------------------------------------------
   * Private Methods
   * -------------------------------------------------------------------------*/

  /**
   * This is a helper function to remove trailing slashes from a hostname.
   * e.g.:
   * - https://myhostname.de/   --> https://myhostname.de
   *
   * @static
   * @param {string} hostname - The hostname.
   * @returns Returns the hostname without trailing slash.
   * @memberof CtrlxCore
   */
  static _removeTrailingSlash(hostname) {
    return hostname.replace(/\/+$/, '');
  }


  /**
   * This is a helper function to parse the host into hostname and port.
   * The function automatically defaults the port to 443 (https) if not part of the host.
   * e.g.:
   * - 127.0.0.1        --> {'hostname':'127.0.0.1', 'port':443}
   * - 127.0.0.1:8443   --> {'hostname':'127.0.0.1', 'port':8443}
   * - server.com:8443  --> {'hostname':'server.com', 'port':8443}
   * Note: This function was written, because the nodejs internal URL class does not work
   *       for ipv6 hostnames in older runtime versions.
   *
   * @static
   * @param {string} host - The host to decode into hostname and port.
   * @returns Returns an object with the decode hostname and port.
   * @memberof CtrlxCore
   */
  static _parseHost(host) {

    // Check for 'localhost' (invariant case)
    if (host.toLowerCase() === 'localhost') {
      // just forward 'localhost' as hostname and default to https
      return {
        'hostname': 'localhost',
        'port': 443
      }
    }

    // Check for IPv4 or IPv6 (without port)
    let ipVersion = net.isIP(host);

    // IPv4
    if (ipVersion === 4) {
      // just forward the IPv4 as hostname and default to https
      return {
        'hostname': host,
        'port': 443
      }
    }

    // IPv6
    if (ipVersion === 6) {
      // just forward the IPv6 as hostname and default to https
      return {
        'hostname': host.replace(/\[|\]/gi, ''), // Remove square brackets for IPv6
        'port': 443
      }
    }

    // Remove trailing slashes
    host = CtrlxCore._removeTrailingSlash(host);

    // Use a regular expression with 2 capture groups (hostname & port) to match
    let reg = /([a-z0-9\-._~%]+|\[[a-z0-9\-._~%!$&'()*+,;=:]+\])(?::([0-9]+))?$/igm;
    let m = reg.exec(host);

    // [IPv6]
    // The IPv6 address in the URL is enclosed by square brackets.
    // For hostname, it does not need to be enclosed by square brackets.
    // For example: // [fe80::202:55ff:fecf:50b]:9010 or //bjaix5:9010
    //
    // We have to remove the square brackets to prevent HTTP request error ENOTFOUND (-3008, getaddrinfo) for Linux targets

    if (m !== null && m.length > 2) {
      // Parsed result can be found in the capture groups
      let hostname = m[1] || host;

      // Check for IPv6
      let possibleIPv6 = hostname.replace(/\[|\]/gi, ''); // Remove square brackets for IPv6
      if (net.isIPv6(possibleIPv6)) {
        hostname = possibleIPv6;
      }

      return {
        'hostname': hostname,
        'port': (m[2]) ? parseInt(m[2]) : 443
      }
    } else {
      // In case the regexp fails, just forward the host as hostname and default to https
      return {
        'hostname': host,
        'port': 443
      }
    }
  }

  /**
   * This is a helper function to decode a JSON Web Token (JWT). See: https://jwt.io/
   * or https://de.wikipedia.org/wiki/JSON_Web_Token.
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
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} username - The username to authenticate against.
   * @param {string} password - The password of the username.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - Returns the token data.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static _authenticate(hostname, port, servername, username, password, timeout, callback) {

    // Authentication data is encoded and send as body.
    const postData = JSON.stringify({
      name: username,
      password: password
    });



    let options = {
      hostname: hostname,
      servername: servername,
      port: port,
      path: '/identity-manager/api/v2/auth/token',
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
      let data = "";

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {

        // We expect statusCode 201 if authentication was successful.
        if (res.statusCode === 201) {
          callback(null, JSON.parse(data));
        } else {
          callback(CtrlxProblemError.fromHttpResponse(res, data), null);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
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
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} tokenType - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err) - After the read, the callback will be called.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static _deleteToken(hostname, port, servername, tokenType, token, timeout, callback) {

    let options = {
      hostname: hostname,
      servername: servername,
      port: port,
      path: '/identity-manager/api/v2/auth/token',
      method: 'DELETE',

      headers: {
        'Authorization': tokenType + ' ' + token,
        'Connection': 'close',
      },
      rejectUnauthorized: false   // accept self-signed certificates
    };

    if (timeout >= 0) {
      options.timeout = timeout;
    }

    const req = https.request(options, (res) => {

      // We expect statusCode 204 if token got destroyed successfully.
      if (res.statusCode === 204) {
        callback(null);
      } else {
        callback(CtrlxProblemError.fromHttpResponse(res, null));
      }

    });

    req.on('timeout', () => {
      req.destroy();
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
  async logIn() {

    return new Promise((resolve, reject) => {

      debug(`logIn(${this._hostname})`);

      // If we are already logged in, then log out before we atempt a new login.
      if (this._state === STATE_LOGGED_IN || this._state === STATE_AUTHENTICATING) {

        this.logOut()
          // After we logged out, we login. Regardless if logout was done correct or not.
          .then(() => { return this.logIn() }, () => { return this.logIn() })
          // Resolve the original promise with the result of the new login promise.
          .then((result) => { resolve(result); }, (err) => { reject(err); });
        return;
      }

      // Now login to the device
      this._state = STATE_AUTHENTICATING;

      CtrlxCore._authenticate(this._hostname, this._port, this._servername, this._username, this._password, this._timeout, (err, data) => {

        // Any communication errors?
        if (err) {
          this._token = undefined;
          this._tokenType = undefined;
          this._token_decoded = undefined;
          this._authorization = undefined;
          this._state = STATE_LOGGED_OUT;

          debug('logIn() ERROR communication', err);
          reject(err);
          return;
        }

        // Check if we got token data or if authentication failed?
        if (!data.access_token || !data.token_type) {
          this._token = undefined;
          this._tokenType = undefined;
          this._token_decoded = undefined;
          this._authorization = undefined;
          this._state = STATE_LOGGED_OUT;

          debug('logIn() ERROR token invalid');
          reject(new Error('Did not receive expected data as authentication response'));
          return;
        }

        // Seems like we got the token. Let's decode the token data.
        try {
          this._token = data.access_token;
          this._tokenType = data.token_type;
          this._authorization = this._tokenType + ' ' + this._token;
          this._state = STATE_LOGGED_IN;

          // Try to parse the token.
          this._token_decoded = data.token_decoded = CtrlxCore._parseJwt(data.access_token);

          // Calculate when this token will expire and take a few seconds buffer time into account.
          const tokenExpiresInSeconds = this._token_decoded.exp - this._token_decoded.iat - 30;
          this._token_expireTime = data.token_expireTime = Date.now().valueOf() + tokenExpiresInSeconds * 1000;

          debug(`logIn() DONE, token will expire in ${tokenExpiresInSeconds} seconds at ${new Date(data.token_expireTime).toLocaleString()} local time `);

        } catch (error) {
          this._token = undefined;
          this._tokenType = undefined;
          this._token_decoded = undefined;
          this._authorization = undefined;
          this._state = STATE_LOGGED_OUT;

          debug('logIn() ERROR token invalid');
          reject(error);
          return;
        }

        // we also return the token data to the caller.
        resolve(data);
      });
    });

  }


  /**
   * Log out from ctrlX CORE to delete session.
   *
   * @returns {Promise.<void, Error>} A promise that returns nothing on success or an Error if rejected.
   * @memberof CtrlxCore
   */
  async logOut() {

    return new Promise((resolve, reject) => {

      debug(`logOut(${this._hostname})`);

      CtrlxCore._deleteToken(this._hostname,
        this._port,
        this._servername,
        this._tokenType,
        this._token,
        this._timeout,
        (err) => {

          // Invalidate members regardless if logout was successful or not.
          // There is no need anyway.
          this._token = undefined;
          this._tokenType = undefined;
          this._token_decoded = undefined;
          this._authorization = undefined;
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
   * @param {*|undefined} data - Data to be tansfered in case of a read request with input data. Set to undefined in no input data (default).
   * @param {string} type - What kind of data to read ('data', 'metadata' or 'browse').
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  async datalayerRead(path, data = undefined, type = 'data') {

    return new Promise((resolve, reject) => {

      debug(`datalayerRead(${type})`);

      // Throw an error if not yet logged in.
      if (this._state !== STATE_LOGGED_IN) {
        let err = new Error('Failed to read from Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.datalayerRead(path, data, type); })
          .then((result) => { resolve(result); })
          .catch((err) => { reject(err); });

        return;
      }

      // Perform the read.
      CtrlxDatalayer.read(this._hostname,
        this._port,
        this._servername,
        this._authorization,
        path,
        data,
        type,
        this._timeout,
        (err, data) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status === 401 && this._autoReconnect) {
              debug(`datalayerRead(${type}) RECONNECT`);
              this.logIn().then(() => { return this.datalayerRead(path, data, type); })
                .then((result) => { resolve(result); })
                .catch((err) => { reject(err); })
                .finally(() => { this._state = STATE_LOGGED_IN; });
            } else {
              debug(`datalayerRead(${type}) ERROR`);
              reject(err);
            }
          } else {
            debug(`datalayerRead(${type}) DONE`);
            resolve(data);
          }
        });

    });

  }


  /**
   * Write a data value to the ctrlX Data Layer.
   *
   * @param {string} path - The datalayer path, that you want to access.
   * @param {*|undefined} data - The data to write.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  async datalayerWrite(path, data) {

    return new Promise((resolve, reject) => {

      debug('datalayerWrite()');

      if (this._state !== STATE_LOGGED_IN) {
        let err = new Error('Failed to read from Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.datalayerWrite(path, data); })
          .then((result) => { resolve(result); })
          .catch((err) => { reject(err); });

        return;
      }

      // Perform the write.
      CtrlxDatalayer.write(this._hostname,
        this._port,
        this._servername,
        this._authorization,
        path,
        data,
        this._timeout,
        (err, dataReturned) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status === 401 && this._autoReconnect) {
              debug(`datalayerWrite() RECONNECT`);
              this.logIn().then(() => { return this.datalayerWrite(path, data); })
                .then((result) => { resolve(result); })
                .catch((err) => { reject(err); })
                .finally(() => { this._state = STATE_LOGGED_IN; });
            } else {
              reject(err);
              debug('datalayerWrite() ERROR');
            }
          } else {
            debug('datalayerWrite() DONE');
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
  async datalayerReadMetadata(path) {
    return this.datalayerRead(path, undefined, 'metadata');
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
  async datalayerBrowse(path) {
    return this.datalayerRead(path, undefined, 'browse');
  }


  /**
   * Calls the create method on the node of the ctrlX Data Layer. This is usually necessary to create new
   * resources or objects. E.g. to create a new axis on the Motion App.
   *
   * @param {string} path - The datalayer path, that you want to call create on.
   * @param {*} data - The data to to be given as argument to the create.
   * @returns {Promise.<Object, Error>} A promise that returns the data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  async datalayerCreate(path, data) {

    return new Promise((resolve, reject) => {

      debug('datalayerCreate()');

      if (this._state !== STATE_LOGGED_IN) {
        let err = new Error('Failed to create node on Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new create promise to resolve the original promise.
        this.logIn().then(() => { return this.datalayerCreate(path, data); })
          .then((result) => { resolve(result); })
          .catch((err) => { reject(err); });

        return;
      }

      // Perform the create.
      CtrlxDatalayer.create(this._hostname,
        this._port,
        this._servername,
        this._authorization,
        path,
        data,
        this._timeout,
        (err, dataReturned) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status === 401 && this._autoReconnect) {
              debug(`datalayerCreate() RECONNECT`);
              this.logIn().then(() => { return this.datalayerCreate(path, data); })
                .then((result) => { resolve(result); })
                .catch((err) => { reject(err); })
                .finally(() => { this._state = STATE_LOGGED_IN; });
            } else {
              reject(err);
              debug('datalayerCreate() ERROR');
            }
          } else {
            debug('datalayerCreate() DONE');
            resolve(dataReturned);
          }
        });

    });
  }


  /**
   * Calls the delete method on a ctrlX Data Layer node. This is usually necessary if you want to
   * delete a resource or object.
   *
   * @param {string} path - The datalayer path, that you want to call delete on.
   * @returns {Promise.<void, Error>} A promise that returns without data on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  async datalayerDelete(path) {

    return new Promise((resolve, reject) => {

      debug('datalayerDelete()');

      if (this._state !== STATE_LOGGED_IN) {
        let err = new Error('Failed to delete node on Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new delete promise to resolve the original promise.
        this.logIn().then(() => { return this.datalayerDelete(path); })
          .then((result) => { resolve(result); })
          .catch((err) => { reject(err); });

        return;
      }

      // Perform the delete.
      CtrlxDatalayer.delete(this._hostname,
        this._port,
        this._servername,
        this._authorization,
        path,
        this._timeout,
        (err) => {
          if (err) {
            // If automatic reconnect is enabled, then we try one login attempt and then try again.
            if (err.status === 401 && this._autoReconnect) {
              debug(`datalayerDelete() RECONNECT`);
              this.logIn().then(() => { return this.datalayerDelete(path); })
                .then((result) => { resolve(result); })
                .catch((err) => { reject(err); })
                .finally(() => { this._state = STATE_LOGGED_IN; });
            } else {
              reject(err);
              debug('datalayerDelete() ERROR');
            }
          } else {
            debug('datalayerDelete() DONE');
            resolve();
          }
        });

    });
  }


  /**
   * Creates a subscription to a set of nodes. The subscription emits events whenever one of the nodes in
   * the subscription changes.
   *
   * @param {string[]} paths - An array of datalayer paths, that you want to subscribe.
   * @param {number|undefined} publishIntervalMs - The interval in milliseconds that is requested as update interval from the server.
   *                                               If omitted, then the server will chose a default value (usually 1s).
   * @returns {Promise.<Object, Error>} A promise that returns the subscription object on success or an Error if rejected.
   * @memberof CtrlxCore
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  async datalayerSubscribe(paths, publishIntervalMs = undefined) {

    return new Promise((resolve, reject) => {

      debug(`datalayerSubscribe(${paths})`);

      // Throw an error if not yet logged in.
      if (this._state !== STATE_LOGGED_IN) {
        let err = new Error('Failed to subscribe to Data Layer. Not authenticated. Please login first.');
        reject(err);
        return;
      }

      // Check if the token might have expired. If so, get a new one.
      if (Date.now() > this._token_expireTime) {

        // Login first, then make a new read promise to resolve the original promise.
        this.logIn().then(() => { return this.datalayerSubscribe(paths); })
          .then((result) => { resolve(result); })
          .catch((err) => { reject(err); });

        return;
      }

      // The subscription is encapsulated in a separate object.
      let sub = new CtrlxDatalayerSubscription(this._hostname, this._port, this._servername, this._tokenType + ' ' + this._token, paths, publishIntervalMs);

      sub.open((err, subscription) => {
        if (err) {
          // If automatic reconnect is enabled, then we try one login attempt and then try again.
          if (err.status === 401 && this._autoReconnect) {
            debug(`datalayerSubscribe(${paths}) RECONNECT`);
            this.logIn().then(() => { return this.datalayerSubscribe(paths); })
              .then((result) => { resolve(result); })
              .catch((err) => { reject(err); })
              .finally(() => { this._state = STATE_LOGGED_IN; });
          } else {
            debug(`datalayerSubscribe(${paths}) ERROR`, err);
            reject(err);
          }
        } else {
          debug(`datalayerSubscribe(${paths}) DONE`);
          resolve(subscription);
        }
      });

    });
  }

}

module.exports = CtrlxCore;

