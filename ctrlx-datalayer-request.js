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
  'use strict';
  let mustache = require("mustache");


  /* ---------------------------------------------------------------------------
   * NODE - Request
   * -------------------------------------------------------------------------*/
  function CtrlxDatalayerRequest(config) {
    RED.nodes.createNode(this, config);

    // Save settings in local node
    this.device = config.device;
    this.configNode = RED.nodes.getNode(this.device);
    this.name = config.name;
    this.path = config.path;
    this.method = config.method;
    this.isTemplatedPath = (this.path || "").indexOf("{{") != -1;
    if (RED.settings.httpRequestTimeout) { this.reqTimeout = parseInt(RED.settings.httpRequestTimeout) || 120000; }
    else { this.reqTimeout = 120000; }




    let node = this;
    if (this.configNode) {
      node.status({fill: "red", shape: "ring", text: "not logged in"});


      //
      // Input handler
      //
      node.on("input", function(msg, send, done) {
        node.status({fill: "blue", shape: "dot", text: "requesting"});

        // Prepare the path
        let path = node.path || msg.path;
        if (msg.path && node.path && (node.path !== msg.path)) {
          node.warn(RED._("common.errors.nooverride"));
        }
        if (node.isTemplatedPath) {
          path = mustache.render(node.path, msg);
        }
        if (!path) {
          node.error("property path for node is not set", msg);
          done();
          return;
        }

        // Prepare the method
        let method = node.method || "READ";
        if (msg.method && node.method && (node.method !== "msg")) {
          node.warn(RED._("common.errors.nooverride"));
        }
        if (msg.method && node.method && (node.method === "msg")) {
          method = msg.method.toUpperCase();
        }
        if (!method) {
          node.error("property method for node is not set", msg);
          done();
          return;
        }

        // Prepare the timeout
        let timeout = node.reqTimeout;
        if (msg.requestTimeout !== undefined) {
          if (isNaN(msg.requestTimeout)) {
              node.warn("msg.requestTimeout is given as NaN");
          } else if (msg.requestTimeout < 1) {
              node.warn(RED._("msg.requestTimeout is given as negative value"));
          } else {
              timeout = msg.requestTimeout;
          }
        }
        node.configNode.setTimeout(timeout);

        // Set the topic (if msg.topic is not yet set, then we set it to the path)
        if (msg.topic === "") {
          msg.topic = path;
        }

        if (method == 'READ') {

          //
          // READ
          //
          node.configNode.datalayerRead(node, path,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                node.configNode.logAdditionalErrorInfo(node, err);
                return;
              }

              // For maximum backwards compatibility, check that send exists.
              // If this node is installed in Node-RED 0.x, it will need to
              // fallback to using `node.send`
              send = send || function() { node.send.apply(node, arguments) }

              msg.payload = data;
              send(msg);

              // Once finished, call 'done'.
              // This call is wrapped in a check that 'done' exists
              // so the node will work in earlier versions of Node-RED (<1.0)
              if (done) {
                done();
              }

              node.status({fill: "green", shape: "dot", text: "Request successfull"});
            });

        } else if (method == 'WRITE') {

          //
          // WRITE
          //
          node.configNode.datalayerWrite(node, path, msg.payload,
            function(err) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                node.configNode.logAdditionalErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              send(msg);

              if (done) {
                done();
              }
              node.status({fill: "green", shape: "dot", text: "Request successfull"});
            });

        } else if (method == 'CREATE') {

          //
          // CREATE
          //
          node.configNode.datalayerCreate(node, path, msg.payload,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                node.configNode.logAdditionalErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              msg.payload = data;
              send(msg);

              if (done) {
                done();
              }
              node.status({fill: "green", shape: "dot", text: "Request successfull"});
            });

        } else if (method == 'DELETE') {

          //
          // DELETE
          //
          node.configNode.datalayerDelete(node, path,
            function(err) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                node.configNode.logAdditionalErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              send(msg);

              if (done) {
                done();
              }

              node.status({fill: "green", shape: "dot", text: "Request successfull"});
            });

        } else if (method == 'METADATA') {
          //
          // METADATA
          //
          node.configNode.datalayerReadMetadata(node, path,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                node.configNode.logAdditionalErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              msg.payload = data;
              send(msg);

              if (done) {
                done();
              }

              node.status({fill: "green", shape: "dot", text: "Request successfull"});
          });

        }else if (method == 'BROWSE') {
          //
          // BROWSE
          //
          node.configNode.datalayerBrowse(node, path,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                node.configNode.logAdditionalErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              msg.payload = data;
              send(msg);

              if (done) {
                done();
              }

              node.status({fill: "green", shape: "dot", text: "Request successfull"});

          });

        }else {
          if (done) {
            done('Method property of node unknown or not implemented:' + node.method);
          } else {
            node.error('Method property of node unknown or not implemented:' + node.method, msg);
          }
          node.status({fill: "red", shape: "ring", text: "Request failed"});
        }

      });


      //
      // Close handler
      //
      this.on('close', function(done) {
        node.configNode.deregister(node, done);
      });


      // Register this node at the config node to receive updates on state change. The config node also
      // provides all functionality, that is used in the handlers above.
      if (this.configNode.connected) {
        node.status({fill:"green", shape:"dot", text:"authenticated"});
      }
      node.configNode.register(node);

    } else {
      this.error("Missing configuration node for ctrlX Data Layer");
    }
  }
  RED.nodes.registerType("ctrlx-datalayer-request", CtrlxDatalayerRequest);
};
