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


// This test-helper module makes the node unit test framework from the Node-RED core available for node contributors.
// See:
// - https://github.com/node-red/node-red-node-test-helper
// - https://github.com/node-red/node-red/wiki/Testing
const helper = require("node-red-node-test-helper");
// To get started, we need to tell the helper where to find the node-red runtime. this is done by calling:
helper.init(require.resolve('node-red'));

// The nodes to be tested
const ctrlxConfigNode = require("../ctrlx-config.js");
const ctrlxConfigSubscriptionNode = require("../ctrlx-config-subscription.js");
const ctrlxDatalayerSubscribeNode = require("../ctrlx-datalayer-subscribe.js");

// The the server mockup to test against
const CtrlxMockup = require('./helper/CtrlxMockupV2')
const CtrlxDatalayerSubscription = require('../lib/CtrlxDatalayerSubscription');

// Additional helper
const expect = require('chai').expect;
const CtrlxCore = require('../lib/CtrlxCore');



/*
 * This test group contains test cases for Node-RED nodes.
 */
describe('ctrlx-datalayer-subscribe', function () {

  function getHostname() {
    return process.env.TEST_HOSTNAME || 'localhost';
  }
  function getUsername() {
    return process.env.TEST_USERNAME || 'boschrexroth';
  }
  function getPassword() {
    return process.env.TEST_PASSWORD || 'boschrexroth';
  }

  // Prepare the ctrlX Device Server Mockup
  let testServer;
  before(function (done) {
    testServer = new CtrlxMockup();
    testServer.startServer('localhost', CtrlxCore._parseHost(getHostname()).port, () => {
      done();
    });
  });
  after(function (done) {
    this.timeout(10000);
    testServer.stopServer(() => {
      done();
    });
  });


  // Prepare the Node-RED test framework
  beforeEach(function (done) {
    helper.startServer(done);
  });
  afterEach(function (done) {
    helper.unload().then(function () {
      helper.stopServer(done);
    });
  });



  describe('ctrlx-datalayer-subscribe: Basic Functionality', function () {

    it('should be loaded as imported by the flow and receive an update', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-subscribe", "subscription": "s1", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "subscribe", "wires": [["h1"]] },
        { "id": "s1", "type": "ctrlx-config-subscription", "device": "c1", "name": "sub1", "publishIntervalMs": "100" },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxConfigSubscriptionNode, ctrlxDatalayerSubscribeNode], flow, credentials, () => {

        let c1 = helper.getNode("c1");
        expect(c1).to.have.property('name', 'ctrlx');
        expect(c1).to.have.property('hostname', getHostname());
        expect(c1).to.have.property('credentials').eql({
          username: getUsername(),
          password: getPassword()
        });

        let s1 = helper.getNode("s1");
        expect(s1).to.have.property('name', 'sub1');
        expect(s1).to.have.property('publishIntervalMs', '100');

        let n1 = helper.getNode("n1");
        expect(n1).to.have.property('name', 'subscribe');
        expect(n1).to.have.property('path', 'framework/metrics/system/cpu-utilisation-percent');

        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('topic').to.be.a('string').eql('framework/metrics/system/cpu-utilisation-percent');
            expect(msg).to.have.property('timestamp').to.be.a('number');
            expect(msg).to.have.property('timestampFiletime').to.be.a('number');
            expect(msg).to.have.property('type').to.be.a('string').eql('double');
            expect(msg).to.have.property('payload').to.be.a('number').within(0, 100);

            expect(msg.timestamp).to.be.eql(CtrlxDatalayerSubscription.convertTimestamp2Date(msg.timestampFiletime).valueOf());

            const deltaTime = Math.abs(msg.timestamp.valueOf() - Date.now());
            expect(deltaTime).to.be.below(500);

            done();

            s1.subscription.close();
          }
          catch (err) {
            s1.subscription.close();
            done(err);
          }
        });
      });
    });



    it('should be receive updates within 100ms publishTime', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-subscribe", "subscription": "s1", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "subscribe", "wires": [["h1"]] },
        { "id": "s1", "type": "ctrlx-config-subscription", "device": "c1", "name": "sub1", "publishIntervalMs": "100" },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxConfigSubscriptionNode, ctrlxDatalayerSubscribeNode], flow, credentials, () => {

        let s1 = helper.getNode("s1");
        expect(s1).to.have.property('publishIntervalMs', '100');
        let h1 = helper.getNode("h1");

        let numReceived = 0;

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('topic').to.be.a('string').eql('framework/metrics/system/cpu-utilisation-percent');
            expect(msg).to.have.property('timestamp').to.be.a('number');
            expect(msg).to.have.property('type').to.be.a('string').eql('double');
            expect(msg).to.have.property('payload').to.be.a('number').within(0, 100);
            numReceived++;
          }
          catch (err) {
            s1.subscription.close();
            done(err);
          }
        });

        // Usually we should have received 10 updates within 1s by using a publishInterval of 100ms
        setTimeout(() => {
          expect(numReceived).to.be.greaterThan(8);
          done();
          s1.subscription.close();
        }, 1200);
      });
    });


    it('should be reconnecting and receive updates after connection got broken', function (done) {

      this.timeout(8000);

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-subscribe", "subscription": "s1", "path": "test/broken/connection/i", "name": "subscribe", "wires": [["h1"]] },
        { "id": "s1", "type": "ctrlx-config-subscription", "device": "c1", "name": "sub1", "publishIntervalMs": "100" },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxConfigSubscriptionNode, ctrlxDatalayerSubscribeNode], flow, credentials, () => {

        let s1 = helper.getNode("s1");
        expect(s1).to.have.property('publishIntervalMs', '100');
        let h1 = helper.getNode("h1");

        let numReceived = 0;

        // @ts-ignore
        h1.on("input", (msg) => {
          // Disable internal reconnection for our test.
          s1.subscription._noInternalReconnect = true;

          try {
            expect(msg).to.have.property('topic').to.be.a('string').eql('test/broken/connection/i');    // Special node to instruct mockup to quit connection after 1sec
            expect(msg).to.have.property('timestamp').to.be.a('number');
            expect(msg).to.have.property('type').to.be.a('string').eql('int16');
            expect(msg).to.have.property('payload').to.be.a('number').within(0, 100);
            numReceived++;
          }
          catch (err) {
            s1.subscription.close();
            done(err);
          }
        });

        // Server will disconnect after 1 second. Due to 100ms publish time make sure to expect more than 10 packets
        // Reconnect shall happen after max 2 seconds retry and 2 seconds for reconnect
        setTimeout(() => {
          expect(numReceived).to.be.greaterThan(15);
          s1.subscription.close();
          done();
        }, 5000);
      });
    });



  });



});
