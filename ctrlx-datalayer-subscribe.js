/**
 *
 * MIT License
 *
 * Copyright (c) 2020-2021, Bosch Rexroth AG
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
  const CtrlxDatalayerSubscription = require('./lib/CtrlxDatalayerSubscription');


  /* ---------------------------------------------------------------------------
   * NODE - Subscribe
   * -------------------------------------------------------------------------*/
  function CtrlxDatalayerSubscribe(config) {
    RED.nodes.createNode(this, config);

    // Save settings in local node
    this.subscription = config.subscription;
    this.configSubscription = RED.nodes.getNode(this.subscription);
    this.name = config.name;
    this.path = config.path;


    //
    // Define functions called by nodes
    //
    let node = this;
    this.setStatus = function(status) {
      node.status(status);
    };


    if (this.configSubscription) {
      node.status({fill: 'red', shape: 'ring', text: 'not logged in'});

      if (this.configSubscription.configNodeDevice.connected) {
        node.status({fill:'green', shape:'dot', text:'authenticated'});
      }


      //
      // Emit handler
      //
      node.configSubscription.register(node, node.path, (err, data, lastEventId) => {

        if (err) {
          node.status({fill: 'red', shape: 'ring', text: 'subscription failed'});
          node.error(err);
        } else {
          node.status({fill: 'green', shape: 'dot', text: `received data #${lastEventId}`});
          node.send({
            topic: data.node,
            payload: data.value,
            type: data.type,
            timestamp:  data.timestamp,
            timestampDate: CtrlxDatalayerSubscription.convertTimestamp2Date(data.timestamp)
          });
        }
      });


      //
      // Close handler
      //
      this.on('close', function(done) {
        node.configSubscription.deregister(node, done);
      });


    } else {
      this.error('Missing configuration node for subscription to ctrlX Data Layer');
    }
  }

  RED.nodes.registerType('ctrlx-datalayer-subscribe', CtrlxDatalayerSubscribe);
};
