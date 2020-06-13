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



module.exports = function(RED) {
  const CtrlxCore = require('./lib/CtrlxCore');
  const CtrlxProblemError = require('./lib/CtrlxProblemError');


  /* ---------------------------------------------------------------------------
   * API for frontend UI
   * -------------------------------------------------------------------------*/

  // https://discourse.nodered.org/t/create-an-admin-configuration-api-https-endpoint/4423/7
  // https://discourse.nodered.org/t/accessing-server-side-from-client-side/26022/4
  RED.httpAdmin.get('/ctrlx/browse', function(req, res, next) {
    //console.log(req.query);

    var id = req.query.id;
    var username = req.query.username;
    var password = req.query.password;
    var hostname = req.query.hostname;
    var path = req.query.path;

    if (hostname && username && password) {

      // The frontend send us hostname, username and a password, so let's use this information
      // and establish a connection to browse on the device.
      let ctrlx = new CtrlxCore(hostname, username, password);

      ctrlx.logIn()
        .then(() => ctrlx.datalayerBrowse(path) )
        .then((data) => {
          if (!data || !data.value ) {
            return res.end('[]');
          }
          res.end(JSON.stringify(data.value));
        })
        .catch((err) => {
          res.end('[]');
        })
        .finally(() => ctrlx.logOut());

    } else if (id) {

      // Let's use an already instances config node in the runtime to make our browse on the device.
      var configNode = RED.nodes.getNode(id);

      if (!configNode) {
        res.end('[]');
        return;
      }

      configNode.datalayerBrowse(null, path, (err, data) => {

        if (err) {
          return res.end('[]');
        }
        if (!data || !data.value ) {
          return res.end('[]');
        }

        res.end(JSON.stringify(data.value));
      })

    } else {
      // we do not have enough infos to establish a session to a device and query the infos.
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
    this.connect = function () {
      if (!node.connected && !node.connecting) {
        node.connecting = true;
        try {
          node.ctrlX.logIn(null)
          .then((data) => {
            node.connecting = false;
            node.connected = true;
            if (node.debug) {
              node.log('Successfully logged in to: ' + node.hostname);
              node.log('Token will expire at ' + new Date(data.token_expireTime).toLocaleString() + ' local time');
            }

            for (let id in node.users) {
              if (Object.prototype.hasOwnProperty.call(node.users, id)) {
                node.users[id].status({fill:"green", shape:"dot", text:"Authenticated"});
              }
            }

            // Now execute all the pending requests
            for (let id in node.pendingRequests) {
              if (Object.prototype.hasOwnProperty.call(node.pendingRequests, id)) {

                switch(node.pendingRequests[id].method) {
                  case 'READ': {
                    node.datalayerRead(id, node.pendingRequests[id].path, node.pendingRequests[id].callback);
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
                  default: {
                    node.error('internal error: received invalid pending request!');
                  }
                }

                delete node.pending[id];
              }
            }

          })
          .catch((err) => {
            if (node.debug) {
              node.log('Failed to log in to ' + node.hostname + ' with error ' + err.message);
            }

            for (let id in node.users) {
              if (Object.prototype.hasOwnProperty.call(node.users, id)) {
                node.users[id].status({fill: "red", shape: "ring", text: "Authentication failed"});
              }
            }

            // Now cancel all the pending requests
            for (let id in node.pendingRequests) {
              if (Object.prototype.hasOwnProperty.call(node.pendingRequests, id)) {
                node.pendingRequests[id].callback(err, null);
                delete node.pendingRequests[id];
              }
            }

          });

        }catch(err) {
            console.log(err);
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
        node.ctrlX.datalayerBrowse(path, callback)
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

    this.logAdditionalErrorInfo = function(node, err) {
      if (!this.debug) {
        return;
      }

      if (err instanceof CtrlxProblemError) {
        let message = err.toStringExtended();
        node.log(`${message}`);
        node.warn(`${message}`);
      } else {
        node.log(err.toString());
      }
    }

    // Define config node event listeners
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
        username: {type:"text"},
        password: {type:"password"}
      }
  });
};
