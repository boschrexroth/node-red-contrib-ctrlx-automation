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



module.exports = function(RED) {
  'use strict';
  const CtrlxCore = require('./lib/CtrlxCore');
  const CtrlxProblemError = require('./lib/CtrlxProblemError');


  /* ---------------------------------------------------------------------------
   * API for frontend UI
   * -------------------------------------------------------------------------*/

  // https://discourse.nodered.org/t/create-an-admin-configuration-api-https-endpoint/4423/7
  // https://discourse.nodered.org/t/accessing-server-side-from-client-side/26022/4
  RED.httpAdmin.get('/ctrlx/browse', function(req, res) {
    // console.log(req.query);

    const id = req.query.id;
    const username = req.query.username;
    const password = req.query.password;
    const hostname = req.query.hostname;
    const path = req.query.path;

    if (hostname && username && password) {

      // The frontend send us hostname, username and a password, so let's use this information
      // and establish a connection to browse on the device.
      let ctrlx = new CtrlxCore(hostname, username, password);

      ctrlx.logIn()
        .then(() => ctrlx.datalayerBrowse(path))
        .then((data) => {
          if (!data || !data.value) {
            return res.end('[]');
          }
          res.end(JSON.stringify(data.value));
        })
        .catch((err) => {
          if (err instanceof CtrlxProblemError) {
            res.statusCode = err.status;
            return res.end(err.toStringExtended());
          } else if (err instanceof Error) {
            res.statusCode = 500;
            return res.end(err.message);
          }
        })
        .finally(() => {
          // We have to catch, because this fails for bad credentials
          ctrlx.logOut().catch((err) => RED.log.warn('Failed to log out when trying to browse with error ' + err.message));
        });

    } else if (id) {

      // Let's use an already instances config node in the runtime to make our browse on the device.
      const configNode = RED.nodes.getNode(id);

      if (!configNode) {
        res.statusCode = 404;
        res.end('[]');
        return;
      }

      configNode.datalayerBrowse(null, path, (err, data) => {

        if (err instanceof CtrlxProblemError) {
          res.statusCode = err.status;
          return res.end(err.toStringExtended());
        } else if (err instanceof Error) {
          res.statusCode = 500;
          return res.end(err.message);
        }

        if (!data || !data.value) {
          return res.end('[]');
        }

        res.end(JSON.stringify(data.value));
      })

    } else {
      // we do not have enough infos to establish a session to a device and query the infos.
      res.statusCode = 400;
      return res.end('[]');
    }

  });




  /* ---------------------------------------------------------------------------
   * NODE - config
   * -------------------------------------------------------------------------*/
  function CtrlxConfig(config) {
    RED.nodes.createNode(this, config);

    // Configuration options passed by Node Red
    this.name = config.name;
    this.debug = config.debug;
    this.hostname = config.hostname;
    if (this.credentials) {
      this.username = this.credentials.username;
      this.password = this.credentials.password;
    }

    // Config node state
    this.connected = false;
    this.connecting = false;
    this.closing = false;
    this.ctrlX = new CtrlxCore(this.hostname, this.username, this.password);
    this.ctrlX.autoReconnect = true;

    // If the config node is missing certain options (it was probably deployed prior to an update to the node code),
    // select/generate sensible options for the new fields
    if (typeof this.debug === 'undefined') {
      this.debug = false;
    }

    //
    // Define functions called by nodes
    //
    let node = this;
    this.users = {};
    this.pendingRequests = {};

    // Register function to be called by all nodes which are attached to this config node.
    this.register = function(ctrlxNode) {
      node.users[ctrlxNode.id] = ctrlxNode;
      if (Object.keys(node.users).length === 1) {
        node.connect();
      }
    };

    // Unregister of attached ctrlX node. We log out of ctrlX when the last node unregistered.
    this.deregister = function(ctrlxNode, done) {
      delete node.users[ctrlxNode.id];
      if (node.closing) {
        return done();
      }
      if (Object.keys(node.users).length === 0) {
        if (node.ctrlX) {
          node.ctrlX.logOut()
            .then(() => done())
            .catch(() => done());
        }
      } else {
        done();
      }
    };

    // This function performs the login. Will be automatically called as soon as
    // the first node registers.
    this.connect = function() {
      if (!node.connected && !node.connecting) {
        node.connecting = true;
        try {
          node.ctrlX.logIn()
            .then((data) => {
              node.connecting = false;
              node.connected = true;

              if (node.debug) {
                node.log('Successfully logged in to: ' + node.hostname);
                node.log('Token will expire at ' + new Date(data.token_expireTime).toLocaleString() + ' local time');
              }

              for (let id in node.users) {
                if (Object.prototype.hasOwnProperty.call(node.users, id)) {
                  node.users[id].setStatus({ fill: 'green', shape: 'dot', text: 'authenticated' });
                }
              }

              // Now execute all the pending requests
              for (let id in node.pendingRequests) {
                if (Object.prototype.hasOwnProperty.call(node.pendingRequests, id)) {

                  switch (node.pendingRequests[id].method) {
                    case 'READ': {
                      node.datalayerRead(id, node.pendingRequests[id].path, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'READ_WITH_ARG': {
                      node.datalayerReadWithArg(id, node.pendingRequests[id].path, node.pendingRequests[id].arg, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'WRITE': {
                      node.datalayerWrite(id, node.pendingRequests[id].path, node.pendingRequests[id].data, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'CREATE': {
                      node.datalayerCreate(id, node.pendingRequests[id].path, node.pendingRequests[id].data, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'DELETE': {
                      node.datalayerDelete(id, node.pendingRequests[id].path, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'METADATA': {
                      node.datalayerReadMetadata(id, node.pendingRequests[id].path, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'BROWSE': {
                      node.datalayerBrowse(id, node.pendingRequests[id].path, node.pendingRequests[id].callback);
                      break;
                    }
                    case 'SUBSCRIBE': {
                      node.datalayerSubscribe(id, node.pendingRequests[id].paths, node.pendingRequests[id].publishIntervalMs, node.pendingRequests[id].callback);
                      break;
                    }
                    default: {
                      node.error('internal error: received invalid pending request!');
                    }
                  }

                  delete node.pendingRequests[id];
                }
              }

            })
            .catch((err) => {
              node.connecting = false;
              node.connected = false;

              if (node.debug) {
                node.log('Failed to log in to ' + node.hostname + ' with error ' + err.message);
              }

              for (let id in node.users) {
                if (Object.prototype.hasOwnProperty.call(node.users, id)) {
                  node.users[id].setStatus({ fill: 'red', shape: 'ring', text: 'authentication failed' });
                }
              }

              // Now cancel all the pending requests
              for (let id in node.pendingRequests) {
                if (Object.prototype.hasOwnProperty.call(node.pendingRequests, id)) {
                  node.pendingRequests[id].callback(err, null);
                  delete node.pendingRequests[id];
                }
              }

              // Try again, except if the node has been closed in the meanwhile. E.g. because
              // the node has been deleted or the flow has been reployed with new settings.
              if (!node.closing) {
                setTimeout(node.connect, 5000);
              }

            });

        } catch (err) {
          node.error(err);
        }
      }
    };

    this.setTimeout = function(timeout) {
      node.ctrlX.timeout = timeout;
    }

    this.datalayerRead = function(nodeRef, path, callback) {
      if (node.connected) {
        node.ctrlX.datalayerRead(path)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'READ',
          path: path,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerReadWithArg = function(nodeRef, path, arg, callback) {
      if (node.connected) {
        node.ctrlX.datalayerRead(path, arg)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'READ_WITH_ARG',
          path: path,
          arg: arg,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerWrite = function(nodeRef, path, data, callback) {
      if (node.connected) {
        node.ctrlX.datalayerWrite(path, data)
          .then(() => callback(null))
          .catch((err) => callback(err));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'WRITE',
          path: path,
          data: data,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerCreate = function(nodeRef, path, data, callback) {
      if (node.connected) {
        node.ctrlX.datalayerCreate(path, data)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'CREATE',
          path: path,
          data: data,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerDelete = function(nodeRef, path, callback) {
      if (node.connected) {
        node.ctrlX.datalayerDelete(path)
          .then(() => callback(null))
          .catch((err) => callback(err, null));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'DELETE',
          path: path,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerReadMetadata = function(nodeRef, path, callback) {
      if (node.connected) {
        node.ctrlX.datalayerReadMetadata(path)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'METADATA',
          path: path,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerBrowse = function(nodeRef, path, callback) {
      if (node.connected) {
        node.ctrlX.datalayerBrowse(path)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      } else if (node.connecting && nodeRef) {
        node.pendingRequests[nodeRef.id] = {
          method: 'BROWSE',
          path: path,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.datalayerSubscribe = function(nodeRef, paths, publishIntervalMs, callback) {
      if (node.connected) {
        node.ctrlX.datalayerSubscribe(paths, publishIntervalMs)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      } else if (node.connecting) {
        node.pendingRequests[nodeRef.id] = {
          method: 'SUBSCRIBE',
          paths: paths,
          publishIntervalMs: publishIntervalMs,
          callback: callback
        };
      } else {
        callback(new Error('No session available!'), null);
      }
    }

    this.logAdditionalDebugErrorInfo = function(node, err) {
      if (!this.debug) {
        return;
      }

      if (err instanceof CtrlxProblemError) {
        let message = err.toStringExtended();
        node.log(`${message}`);
      } else {
        node.log(err.toString());
      }
    }

    //
    // Close handler
    //
    node.on("close", function(done) {
      // Logout, when node is closing down.
      node.closing = true;
      node.ctrlX.logOut()
        .then(() => done())
        .catch(() => done());
    });
  }


  RED.nodes.registerType("ctrlx-config", CtrlxConfig, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" }
    }
  });
};
