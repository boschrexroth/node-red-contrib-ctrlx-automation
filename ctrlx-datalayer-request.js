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
    this.payloadFormat = config.payloadFormat;

    // If the config is missing certain options (it was probably deployed prior to an update to the node code),
    // select compatibility options for the new fields
    if (typeof this.payloadFormat === 'undefined') {
      this.payloadFormat = 'v1';
    }

    this.isTemplatedPath = (this.path || "").indexOf("{{") !== -1;
    if (RED.settings.httpRequestTimeout) {
      this.reqTimeout = parseInt(RED.settings.httpRequestTimeout) || 120000;
    }
    else {
      this.reqTimeout = 120000;
    }


    //
    // Define functions called by nodes
    //
    let node = this;
    this.setStatus = function(status) {
      node.status(status);
    };


    if (this.configNode) {
      node.status({ fill: "red", shape: "ring", text: "not logged in" });

      //
      // Input handler
      //
      node.on("input", function(msg, send, done) {
        node.status({ fill: "blue", shape: "dot", text: "requesting" });

        // Prepare the path
        let path = node.path || msg.path;
        if (msg.path && node.path && (node.path !== msg.path)) {
          node.warn(RED._("`msg.path` differs from configuration property *Path* of node"));
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
          node.warn(RED._("`msg.method` differs from configuration property *Method* of node"));
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
        if (msg.topic === undefined || msg.topic === "") {
          msg.topic = path;
        }

        if (method === 'READ' || method === 'READ_WITH_ARG') {

          //
          // READ
          //
          let func = function(err, data) {

            if (err) {
              if (done) {
                done(err); // Node-RED 1.0 compatible
              } else {
                node.error(err, msg); // Node-RED 0.x compatible
              }
              node.status({ fill: "red", shape: "ring", text: "request failed" });
              node.configNode.logAdditionalDebugErrorInfo(node, err);
              return;
            }

            // For maximum backwards compatibility, check that send exists.
            // If this node is installed in Node-RED 0.x, it will need to
            // fallback to using `node.send`
            send = send || function() { node.send.apply(node, arguments) }

            // Return only expected output data. Option 'v1' is for backward compatibility to
            // deprecated Data Layer API v1.
            switch (node.payloadFormat) {
              case 'v1':
                if (data.type === 'object') {
                  msg.payload = data.value;
                } else {
                  msg.payload = data;
                }
                break;
              case 'value':
                msg.payload = data.value;
                break;
              case 'value_type':
                msg.payload = data;
                break;
            }
            send(msg);

            // Once finished, call 'done'.
            // This call is wrapped in a check that 'done' exists
            // so the node will work in earlier versions of Node-RED (<1.0)
            if (done) {
              done();
            }

            node.status({ fill: "green", shape: "dot", text: "request successful" });
          }

          if (method === 'READ_WITH_ARG') {
            node.configNode.datalayerReadWithArg(node, path, msg.payload, func);
          } else {
            node.configNode.datalayerRead(node, path, func);
          }

        } else if (method === 'WRITE') {

          //
          // WRITE
          //

          // Return only expected output data. Option 'v1' is for backward compatibility to
          // deprecated Data Layer API v1.
          let payload = {};
          switch (node.payloadFormat) {
            case 'v1':
              if (msg.payload.type === 'undefined') {
                payload.value = msg.payload;
                payload.type = 'object';
              } else {
                payload = msg.payload;
              }
              break;
            case 'value':
              payload.value = msg.payload;
              break;
            case 'value_type':
              payload = msg.payload;
              break;
          }

          node.configNode.datalayerWrite(node, path, payload,
            function(err) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({ fill: "red", shape: "ring", text: "request failed" });
                node.configNode.logAdditionalDebugErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              send(msg);

              if (done) {
                done();
              }
              node.status({ fill: "green", shape: "dot", text: "request successful" });
            });

        } else if (method === 'CREATE') {

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
                node.status({ fill: "red", shape: "ring", text: "request failed" });
                node.configNode.logAdditionalDebugErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              // Return only expected output data. Option 'v1' is for backward compatibility to
              // deprecated Data Layer API v1.
              switch (node.payloadFormat) {
                case 'v1':
                  if (data.type === 'object') {
                    msg.payload = data.value;
                  } else {
                    msg.payload = data;
                  }
                  break;
                case 'value':
                  msg.payload = data.value;
                  break;
                case 'value_type':
                  msg.payload = data;
                  break;
              }
              send(msg);

              if (done) {
                done();
              }
              node.status({ fill: "green", shape: "dot", text: "request successful" });
            });

        } else if (method === 'DELETE') {

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
                node.status({ fill: "red", shape: "ring", text: "request failed" });
                node.configNode.logAdditionalDebugErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              send(msg);

              if (done) {
                done();
              }

              node.status({ fill: "green", shape: "dot", text: "request successful" });
            });

        } else if (method === 'METADATA') {
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
                node.status({ fill: "red", shape: "ring", text: "request failed" });
                node.configNode.logAdditionalDebugErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              msg.payload = data;
              send(msg);

              if (done) {
                done();
              }

              node.status({ fill: "green", shape: "dot", text: "request successful" });
            });

        } else if (method === 'BROWSE') {
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
                node.status({ fill: "red", shape: "ring", text: "request failed" });
                node.configNode.logAdditionalDebugErrorInfo(node, err);
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              // Return only expected output data. Option 'v1' is for backward compatibility to
              // deprecated Data Layer API v1.
              switch (node.payloadFormat) {
                case 'v1':
                  msg.payload = data;
                  break;
                case 'value':
                  msg.payload = data.value;
                  break;
                case 'value_type':
                  msg.payload = data;
                  break;
              }
              send(msg);

              if (done) {
                done();
              }

              node.status({ fill: "green", shape: "dot", text: "request successful" });
            });

        } else {
          if (done) {
            done('Method property of node unknown or not implemented:' + node.method);
          } else {
            node.error('Method property of node unknown or not implemented:' + node.method, msg);
          }
          node.status({ fill: "red", shape: "ring", text: "request failed" });
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
        node.status({ fill: "green", shape: "dot", text: "authenticated" });
      }
      node.configNode.register(node);

    } else {
      this.error("Missing configuration node for ctrlX Data Layer");
    }
  }

  RED.nodes.registerType("ctrlx-datalayer-request", CtrlxDatalayerRequest);
};
