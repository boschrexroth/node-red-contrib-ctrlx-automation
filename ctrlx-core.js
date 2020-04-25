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
  const CtrlxCore = require('node-red-contrib-ctrlx-core/lib/CtrlxCore')


  /* ---------------------------------------------------------------------------
   * NODE - config
   * -------------------------------------------------------------------------*/
  function CtrlxCoreConfig(config) {
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
            for (var id in node.users) {
              // eslint-disable-next-line no-prototype-builtins
              if (node.users.hasOwnProperty(id)) {
                node.users[id].status({fill:"green", shape:"dot", text:"Authenticated"});
              }
            }
          })
          .catch((err) => {
            if (node.debug) {
              node.log('Failed to log in to ' + node.hostname + ' with error ' + err.message);
            }
            for (var id in node.users) {
              // eslint-disable-next-line no-prototype-builtins
              if (node.users.hasOwnProperty(id)) {
                node.users[id].status({fill: "red", shape: "ring", text: "Authentication failed"});
              }
            }
          });

        }catch(err) {
            console.log(err);
        }
      }
    };

    this.readDatalayer = function(path, callback) {
      if (node.connected) {
        node.ctrlX.readDatalayer(path)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      }
    }

    this.writeDatalayer = function(path, data, callback) {
      if (node.connected) {
        node.ctrlX.writeDatalayer(path, data)
          .then(() => callback(null))
          .catch((err) => callback(err));
      }
    }

    this.readDatalayerMetadata = function(path, callback) {
      if (node.connected) {
        node.ctrlX.readDatalayerMetadata(path)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      }
    }

    this.readDatalayerReferences = function(path, callback) {
      if (node.connected) {
        node.ctrlX.readDatalayerReferences(path, callback)
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
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


  RED.nodes.registerType("ctrlx-core", CtrlxCoreConfig, {
    credentials: {
        username: {type:"text"},
        password: {type:"password"}
      }
  });
};
