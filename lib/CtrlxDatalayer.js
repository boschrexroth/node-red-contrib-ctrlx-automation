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
const CtrlxProblemError = require('./CtrlxProblemError');



// For the requests to the Data Layer, a dedicated agent is created and configured to use
// persistent (keep-alive) TCP connections for multiple http requests. This reduces the overhead
// of of TCP socket establishment for each request and improves performance.
// The number of parallel connections is set to 2, which improves performance by running requests
// in parallel. Tests have shown, that 2 to 3 parallel connections give the best overall results
// for most use cases.
const keepAliveAgent = new https.Agent({
  keepAlive: true,        // Default: false
  keepAliveMsecs: 1000,   // Default: 1000
  maxSockets: 2           // Default: INFINITY
});



/**
 * This class is not meant to be instanced, but holds a set of static utility functions to
 * interact with the data layer over https REST protocol. The various methods of the datalayer
 * (e.g. read, write, create, delete, browse ...) are translated to http-REST semantics (GET, POST, PUT, DELETE).
 *
*/
class CtrlxDatalayer {

  /* ---------------------------------------------------------------------------
   * Static Methods
   * -------------------------------------------------------------------------*/


  /**
   * Create a node in the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} token_type - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to create.
   * @param {object} data - The data to be used for creation of the resource.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - After the read, the callback will be called.
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static create(hostname, token_type, token, path, data, timeout, callback) {

    var postData = JSON.stringify(data);

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/automation/api/v1/' + path,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': token_type + ' ' + token,
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

        // We expect 200 or 201 on success
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          callback(CtrlxProblemError.fromHttpResponse(res, data));
          return;
        }

        // Try to parse the data
        let payload;
        if (data && data.length !== 0) {
          try {
            payload = JSON.parse(data);
          } catch (err) {
            callback(err, null);
          }
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

    req.write(postData);
    req.end();
  }


  /**
   * Delete a node from the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} token_type - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to delete.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err) - After the read, the callback will be called.
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static delete(hostname, token_type, token, path, timeout, callback) {

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/automation/api/v1/' + path,
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': token_type + ' ' + token,
        'Connection': 'keep-alive'
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

        // We expect 200 or 204 on success
        if (res.statusCode !== 200 && res.statusCode !== 204) {
          callback(CtrlxProblemError.fromHttpResponse(res, data));
          return;
        }

        // No error and also no data expected on success.
        callback(null)
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
   * Read a value from the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} token_type - The type of token that is passed as next argument. Usually of type 'Bearer'.
   * @param {string} token - The token for authorization of the request. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to access.
   * @param {object} data - Data to be tansfered in case of a read request with input data. Set to undefined in no input data (default).
   * @param {string} type - The type of information you want to read. Either 'data', 'metadata' or 'browse'.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - After the read, the callback will be called.
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static read(hostname, token_type, token, path, data = undefined, type, timeout, callback) {

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/automation/api/v1/' + path + '?type=' + type,
      method: (typeof data !== 'undefined') ? 'POST' : 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': token_type + ' ' + token,
        'Connection': 'keep-alive'
       },
      agent: keepAliveAgent,
      rejectUnauthorized: false   // accept self-signed certificates
    };

    var postData;
    if (typeof data !== 'undefined') {
      postData = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = postData.length;
    }

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

    if (typeof data !== 'undefined') {
      req.write(postData);
    }
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
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static write(hostname, token_type, token, path, data, timeout, callback) {

    var putData = JSON.stringify(data);

    var options = {
      hostname: hostname,
      servername: (net.isIP(hostname) === 0) ? hostname : '',
      port: '443',
      path: '/automation/api/v1/' + path,
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': token_type + ' ' + token,
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
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

}

module.exports = CtrlxDatalayer;

