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


  /* ---------------------------------------------------------------------------
   * NODE - Request
   * -------------------------------------------------------------------------*/
  function CtrlxCoreDatalayerRequest(config) {
    RED.nodes.createNode(this, config);

    // Save settings in local node
    this.device = config.device;
    this.configNode = RED.nodes.getNode(this.device);
    this.name = config.name;
    this.url = config.url;
    this.method = config.method;

    let node = this;
    if (this.configNode) {
      node.status({fill: "red", shape: "ring", text: "not logged in"});


      //
      // Input handler
      //
      node.on("input", function(msg, send, done) {
        node.status({fill: "blue", shape: "dot", text: "requesting"});

        if (node.method == 'READ') {

          //
          // READ
          //
          node.configNode.readDatalayer(node.url,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
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

        } else if (node.method == 'WRITE') {

          //
          // Write
          //
          node.configNode.writeDatalayer(node.url, msg.payload,
            function(err) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
                return;
              }

              send = send || function() { node.send.apply(node, arguments) }

              send(msg);

              if (done) {
                done();
              }
              node.status({fill: "green", shape: "dot", text: "Request successfull"});
            });

        } else if (node.method == 'METADATA') {
          //
          // METADATA
          //
          node.configNode.readDatalayerMetadata(node.url,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
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

        }  else if (node.method == 'REFERENCES') {
          //
          // REFERENCES
          //
          node.configNode.readDatalayerReferences(node.url,
            function(err, data) {

              if (err) {
                if (done) {
                  done(err); // Node-RED 1.0 compatible
                } else {
                  node.error(err, msg); // Node-RED 0.x compatible
                }
                node.status({fill: "red", shape: "ring", text: "Request failed"});
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
      this.error(RED._("ctrlx-core.errors.missing-config"));
    }
  }
  RED.nodes.registerType("ctrlx-core-datalayer-request", CtrlxCoreDatalayerRequest);
};
