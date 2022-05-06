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

const CtrlxProblemError = require('./lib/CtrlxProblemError');

module.exports = function(RED) {
  'use strict';


  /* ---------------------------------------------------------------------------
   * NODE - config
   * -------------------------------------------------------------------------*/
  function CtrlxConfigSubscription(config) {
    RED.nodes.createNode(this, config);

    // Configuration options passed by Node Red
    this.device = config.device;
    this.configNodeDevice = RED.nodes.getNode(this.device);
    this.name = config.name;
    this.publishIntervalMs = config.publishIntervalMs;


    // Node state
    let node = this;
    this.users = {};
    this.dirty = true;
    this.subscription = null;



    //
    // Define functions called by nodes
    //
    this.setStatus = function(status) {
      Object.values(node.users).forEach((element) => {
        element.node.setStatus(status);
      });
    };

    this.updateSubscription = function() {

      // Only create a new subscription if the list of nodes changed
      if (!node.dirty) {
        return;
      }
      node.dirty = false;

      // Close old subscription
      if (node.subscription) {
        node.subscription.close();
        node.subscription.removeAllListeners();
        node.subscription = null;
      }

      // Create an array of all node paths to subscribe to
      let paths = new Array();
      Object.values(node.users).forEach((element) => {
        if (element.path !== '') {
          paths.push(element.path);
        }
      });

      // No need to create an empty subscription
      if (paths.length === 0) {
        return;
      }

      // Create the subscription
      if (node.configNodeDevice.debug) {
        node.debug('Requesting Subscription for: ' + paths);
      }
      node.configNodeDevice.datalayerSubscribe(node, paths, node.publishIntervalMs, (err, subscription) => {

        if (err) {
          node.error(`Failed to create subscription ${node.name} for nodes ${paths} with error ${err.message}, but will retry`);

          Object.values(node.users).forEach((element) => {
            element.callback(err);
          });

          // Retry to create the subscription soon
          node.dirty = true;
          setTimeout(() => {
            node.updateSubscription();
          }, 1000);

        } else {
          node.subscription = subscription;



          // This is the handler function which dispatches incoming update messages to the nodes.
          node.subscription.on('update', (data, lastEventId) => {
            Object.values(node.users).forEach((element) => {
              if (element.path === data.node) {
                element.callback(null, data, lastEventId);
              }
            });
          });



          // This is the handler which is called on error. E.g. on authorization errors of the whole subscription
          // or when a single node address has a problem.
          node.subscription.on('error', (err) => {

            let isSingleNodeError = false;

            // Check if we have an error, that is only attached to a single node and
            // not to the whole subscription
            if (err instanceof CtrlxProblemError && err._instance) {

              // Distribute the error to actual node.
              Object.values(node.users).forEach((element) => {
                if (element.path === err._instance) {
                  element.callback(err);
                  isSingleNodeError = true;
                }
              });

            }

            if (!isSingleNodeError) {
              // Distribute the error to all registered nodes.
              Object.values(node.users).forEach((element) => {
                element.callback(err);
              });

              // To recover from the error state, let's reset the subscription.
              node.dirty = true;
              setTimeout(() => {
                node.updateSubscription();
              }, 2000);
            }

          });



          // This is the handler if the connection gets closed by the server.
          node.subscription.on('end', () => {

            // Distribute the error to all registered nodes.
            Object.values(node.users).forEach((element) => {
              element.callback(new Error('Server closed connection'));
            });

            // To recover from the error state, let's reset the subscription.
            node.dirty = true;
            setTimeout(() => {
              node.updateSubscription();
            }, 2000);

          });

        }

      });
    }

    // Register function to be called by all nodes which are attached to this config node.
    this.register = function(ctrlxNode, path, callback) {

      node.users[ctrlxNode.id] =
      {
        node: ctrlxNode,
        path: path,
        callback: callback
      };

      if (Object.keys(node.users).length === 1) {
        node.configNodeDevice.register(node);
      }

      // Update list of nodes on next tick
      node.dirty = true;
      setImmediate(() => {
        node.updateSubscription();
      });
    };

    // Unregister of attached ctrlX node.
    this.deregister = function(ctrlxNode, done) {
      delete node.users[ctrlxNode.id];
      if (Object.keys(node.users).length === 0) {
        node.configNodeDevice.deregister(node, done);
      } else {
        done();
      }

      // Update list of nodes on next tick
      node.dirty = true;
      setImmediate(() => {
        node.updateSubscription();
      });
    };


    //
    // Close handler
    //
    node.on("close", function(done) {
      done();
    });

  }


  RED.nodes.registerType("ctrlx-config-subscription", CtrlxConfigSubscription, {
  });
};
