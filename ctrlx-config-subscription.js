/**
 *
 * MIT License
 *
 * Copyright (c) 2020-2023 Bosch Rexroth AG
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
    if (this.publishIntervalMs === '') {
      this.publishIntervalMs = undefined;
    } else if (this.publishIntervalMs !== undefined) {
      this.publishIntervalMs = parseInt(this.publishIntervalMs);
      if (config.publishIntervalUnits === "seconds") {
        this.publishIntervalMs *= 1000;
      } else if (config.publishIntervalUnits === "minutes") {
        this.publishIntervalMs *= (60 * 1000);
      } else if (config.publishIntervalUnits === "hours") {
        this.publishIntervalMs *= (60 * 60 * 1000);
      }
    }
    this.samplingIntervalUs = config.samplingInterval;
    if (this.samplingIntervalUs === '') {
      this.samplingIntervalUs = undefined;
    } else if (this.samplingIntervalUs !== undefined) {
      this.samplingIntervalUs = parseInt(this.samplingIntervalUs);
      if (config.samplingIntervalUnits === "milliseconds") {
        this.samplingIntervalUs *= 1000;
      } else if (config.samplingIntervalUnits === "seconds") {
        this.samplingIntervalUs *= (1000 * 1000);
      } else if (config.samplingIntervalUnits === "minutes") {
        this.samplingIntervalUs *= (60 * 1000 * 1000);
      } else if (config.samplingIntervalUnits === "hours") {
        this.samplingIntervalUs *= (60 * 60 * 1000 * 1000);
      }
    }
    this.errorIntervalMs = config.errorInterval;
    if (this.errorIntervalMs === '') {
      this.errorIntervalMs = undefined;
    } else if (this.errorIntervalMs !== undefined) {
      this.errorIntervalMs = parseInt(this.errorIntervalMs);
      if (config.errorIntervalUnits === "seconds") {
        this.errorIntervalMs *= 1000;
      } else if (config.errorIntervalUnits === "minutes") {
        this.errorIntervalMs *= (60 * 1000);
      } else if (config.errorIntervalUnits === "hours") {
        this.errorIntervalMs *= (60 * 60 * 1000);
      }
    }
    this.keepaliveIntervalMs = config.keepaliveInterval;
    if (this.keepaliveIntervalMs === '') {
      this.keepaliveIntervalMs = undefined;
    } else if (this.keepaliveIntervalMs !== undefined) {
      this.keepaliveIntervalMs = parseInt(this.keepaliveIntervalMs);
      if (config.keepaliveIntervalUnits === "seconds") {
        this.keepaliveIntervalMs *= 1000;
      } else if (config.keepaliveIntervalUnits === "minutes") {
        this.keepaliveIntervalMs *= (60 * 1000);
      } else if (config.keepaliveIntervalUnits === "hours") {
        this.keepaliveIntervalMs *= (60 * 60 * 1000);
      }
    }
    this.queueSize = config.queueSize;
    if (this.queueSize === '') {
      this.queueSize = undefined;
    } else if (this.queueSize !== undefined) {
      this.queueSize = parseInt(this.queueSize);
    }
    this.queueBehaviour = config.queueBehaviour;
    if (this.queueBehaviour === '') {
      this.queueBehaviour = undefined;
    }
    this.deadbandValue = config.deadbandValue;
    if (this.deadbandValue === '') {
      this.deadbandValue = undefined;
    } else if (this.deadbandValue !== undefined) {
      this.deadbandValue = parseInt(this.deadbandValue);
    }


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
          paths = paths.concat(element.path);
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

      const options = {
        'publishIntervalMs': node.publishIntervalMs,
        'samplingIntervalUs': node.samplingIntervalUs,
        'errorIntervalMs': node.errorIntervalMs,
        'keepaliveIntervalMs': node.keepaliveIntervalMs,
        'queueSize': node.queueSize,
        'queueBehaviour': node.queueBehaviour,
        'deadbandValue' : node.deadbandValue
      }

      node.configNodeDevice.datalayerSubscribe(node, paths, options, (err, subscription) => {

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


          // In rare cases (e.g. during boot-up of control, or when the webserver resets) it might happen, that the subscription
          // was successfully created but the strean was already ended by the server before we could the register the corresponding handlers below.
          // So let's handle this race condition explicitly here.
          if (node.subscription.isEndByServer) {

            // To recover from the error state, let's reset the subscription.
            node.dirty = true;
            setTimeout(() => {
              node.updateSubscription();
            }, 2000);
          }


          // This is the handler function which dispatches incoming update messages to the nodes.
          node.subscription.on('update', (data, lastEventId) => {
            Object.values(node.users).forEach((element) => {
              if (element.path === data.node || (Array.isArray(element.path) && element.path.includes(data.node))) {
                element.callback(null, data, lastEventId);
              }
            });
          });


          // This is the handler which is called on error. E.g. on authorization errors of the whole subscription
          // or when a single path address has a problem.
          node.subscription.on('error', (err) => {

            let isSinglPathError = false;

            // Check if we have an error, that is only attached to a single path and
            // not to the whole subscription
            if (err instanceof CtrlxProblemError && err._instance) {

              // Distribute the error to actual node.
              Object.values(node.users).forEach((element) => {
                if (element.path === err._instance || (Array.isArray(element.path) && element.path.includes(err._instance))) {
                  element.callback(err);
                  isSinglPathError = true;
                }
              });

            }

            if (!isSinglPathError) {
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
