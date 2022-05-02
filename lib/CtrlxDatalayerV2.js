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
const CtrlxProblemError = require('../lib/CtrlxProblemError');



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
   * Convert a Data Layer response body from string to a javascript object.
   *
   * This is basicly an extension to JSON.parse(), that supports also 64bit data types, which
   * will be converted to BigInt. Which is not supported by the standard JSON.parse().
   * With standard JSON.parse() a 64bit integer value might get rounded, because javascripts Number
   * is based on a double precision floating point number.
   * E.g. values greater than Number.MAX_SAFE_INTEGER.
   *
   * @static
   * @param {string} data - The content data as returend by a Data Layer request.
   * @returns {object} - The parsed javascript object.
   * @memberof CtrlxDatalayer
   * @throws {SyntaxError} On invalid JSON objects.
   */
  static _parseData(data) {
    let payload = JSON.parse(data);

    if (payload.type === "int64" || payload.type === "uint64") {
      let strBig = data.match(new RegExp(/(?:"value":)(.*?)(?:[,}])/))[1];
      payload.value = BigInt(strBig);
    } else if (payload.type === "arint64" || payload.type === "aruint64") {
      let strBigArray = data.match(new RegExp(/(?:"value":)(?:.*\[)(.*?)(?:\])/))[1];
      payload.value = Array.from(strBigArray.split(","), (s) => BigInt(s))
    }

    return payload;
  }


  /**
   * Create a node in the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {number} port - The port of the server socket on the device. Usually 443 (https).
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} authorization - The full authorization header, usually Bearer with token. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to create.
   * @param {*} data - The data to be used for creation of the resource.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - After the read, the callback will be called.
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static create(hostname, port, servername, authorization, path, data, timeout, callback) {

    let options = {
      hostname: hostname,
      servername: servername,
      port: port,
      path: encodeURI('/automation/api/v2/nodes/' + path),
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization,
        'Connection': 'keep-alive',
      },
      agent: keepAliveAgent,
      rejectUnauthorized: false   // accept self-signed certificates
    };

    // Consider, that there might be creates with empty arguments (no data). I.e. for the node '/motion/axs/<axs_name>/cmd/reset'
    let postData;
    if (data) {
      postData = JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
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

        // We expect 200 or 201 on success
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          callback(CtrlxProblemError.fromHttpResponse(res, data));
          return;
        }

        // Try to parse the data
        let payload;
        if (data && data.length !== 0) {
          try {
            payload = CtrlxDatalayer._parseData(data);
          } catch (err) {
            callback(err, null);
          }
        }

        // No error, return payload data.
        callback(null, payload);
      });
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.on('error', (err) => {
      callback(err);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  }


  /**
   * Delete a node from the Data Layer.
   *
   * @static
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {number} port - The port of the server socket on the device. Usually 443 (https).
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} authorization - The full authorization header, usually Bearer with token. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to delete.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err) - After the read, the callback will be called.
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static delete(hostname, port, servername, authorization, path, timeout, callback) {

    let options = {
      hostname: hostname,
      servername: servername,
      port: port,
      path: encodeURI('/automation/api/v2/nodes/' + path),
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization,
        'Connection': 'keep-alive'
      },
      agent: keepAliveAgent,
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
      req.destroy();
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
  * @param {number} port - The port of the server socket on the device. Usually 443 (https).
  * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
  * @param {string} authorization - The full authorization header, usually Bearer with token. Note, that this needs to be a valid session token on the given hostname.
  * @param {string} path - The datalayer path, that you want to access.
  * @param {*|undefined} data - Data to be tansfered in case of a read request with input data. Set to undefined in no input data (default).
  * @param {string} type - The type of information you want to read. Either 'data', 'metadata' or 'browse'.
  * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
  * @param {function} callback(err, data) - After the read, the callback will be called.
  * @memberof CtrlxDatalayer
  * @throws {CtrlxProblemError} Throws an error when device returns an error.
  * @throws Throws different http errors when connection could not be established.
  */
  static read(hostname, port, servername, authorization, path, data = undefined, type, timeout, callback) {

    let options = {
      hostname: hostname,
      servername: servername,
      port: port,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization,
        'Connection': 'keep-alive'
      },
      agent: keepAliveAgent,
      rejectUnauthorized: false   // accept self-signed certificates
    };

    switch (type) {
      case 'browse':
      case 'metadata':
        options.path = encodeURI('/automation/api/v2/nodes/' + path + '?type=' + type);
        break;

      case 'read':
      default:
        if (typeof data !== 'undefined') {
          options.path = encodeURI('/automation/api/v2/nodes/' + path + '?data=')
            + encodeURIComponent(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
        } else {
          options.path = encodeURI('/automation/api/v2/nodes/' + path);
        }
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
          payload = CtrlxDatalayer._parseData(data);
        } catch (err) {
          callback(err, null);
        }

        // No error, return payload data.
        callback(null, payload);
      });
    });

    req.on('timeout', () => {
      req.destroy();
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
   * @param {number} port - The port of the server socket on the device. Usually 443 (https).
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} authorization - The full authorization header, usually Bearer with token. Note, that this needs to be a valid session token on the given hostname.
   * @param {string} path - The datalayer path, that you want to access.
   * @param {*} data - The data to be written on the given path.
   * @param {number} timeout - Request timeout in milliseconds. Set to -1 to use defaults.
   * @param {function} callback(err, data) - After the read, the callback will be called.
   * @memberof CtrlxDatalayer
   * @throws {CtrlxProblemError} Throws an error when device returns an error.
   * @throws Throws different http errors when connection could not be established.
   */
  static write(hostname, port, servername, authorization, path, data, timeout, callback) {

    let options = {
      hostname: hostname,
      servername: servername,
      port: port,
      path: encodeURI('/automation/api/v2/nodes/' + path),
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization,
        'Connection': 'keep-alive'
      },
      agent: keepAliveAgent,
      rejectUnauthorized: false   // accept self-signed certificates
    };

    // Consider, that there might be writes with empty arguments (no data). I.e. for the node 'diagnosis/confirm/error'
    let putData;
    if (data) {
      putData = JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(putData);
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
        if (data && data.length !== 0) {
          try {
            payload = CtrlxDatalayer._parseData(data);
          } catch (err) {
            callback(err, null);
          }
        }

        // No error, return payload data.
        callback(null, payload);
      });
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.on('error', (err) => {
      callback(err);
    });

    if (putData) {
      req.write(putData);
    }

    req.end();
  }


}

module.exports = CtrlxDatalayer;

