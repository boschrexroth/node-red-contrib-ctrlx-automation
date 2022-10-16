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
const ctrlxDatalayerRequestNode = require("../ctrlx-datalayer-request.js");

// The the server mockup to test against
const CtrlxMockup = require('./helper/CtrlxMockupV2')
const CtrlxCore = require('../lib/CtrlxCore')

const expect = require('chai').expect;



/*
 * This test group contains test cases for Node-RED nodes.
 */
describe('ctrlx-datalayer-request', function () {

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
    testServer.startServer('localhost', 443, () => {
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



  describe('ctrlx-datalayer-request: Basic Functionality', function () {

    it('should be loaded as imported by the flow', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "READ", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": "localhost", "debug": true }
      ];
      let credentials = {
        c1: {
          username: "boschrexroth",
          password: "boschrexroth"
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let c1 = helper.getNode("c1");
        c1.should.have.property('name', 'ctrlx');
        c1.should.have.property('hostname', 'localhost');
        c1.should.have.property('credentials', {
          username: "boschrexroth",
          password: "boschrexroth"
        });

        let n1 = helper.getNode("n1");
        n1.should.have.property('name', 'request');
        n1.should.have.property('method', 'READ');
        n1.should.have.property('path', 'framework/metrics/system/cpu-utilisation-percent');

        done();
      });
    });


    it('should read a value', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "READ", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('payload').with.property('value').that.is.a('number').within(0, 100);
            expect(msg).to.have.property('payload').with.property('type').that.is.a('string').eql('double');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" });
      });
    });


    it('should read a value and set the empty msg.topic', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "READ", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('payload').with.property('value').that.is.a('number').within(0, 100);
            expect(msg).to.have.property('payload').with.property('type').that.is.a('string').eql('double');
            expect(msg).to.have.property('topic').which.is.a('string').eql('framework/metrics/system/cpu-utilisation-percent');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" }); // No topic is set for the msg, thus the msg.topic should be set as check above.
      });
    });



    it('should read a value and NOT set the pre-set msg.topic', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "READ", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('payload').with.property('value').that.is.a('number').within(0, 100);
            expect(msg).to.have.property('payload').with.property('type').that.is.a('string').eql('double');
            expect(msg).to.have.property('topic').which.is.a('string').eql('MYTOPIC');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "", topic: "MYTOPIC" }); // A topic is set for the msg, thus the msg.topic should NOT be set as check above.
      });
    });


    it('should read with arguments', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "READ_WITH_ARG", "path": "test/add", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('payload').with.property('value').that.is.a('number').eql(22);
            expect(msg).to.have.property('payload').with.property('type').that.is.a('string').eql('uint32');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: { type: 'object', value: { arg1: 17, arg2: 5 } } });
      });
    });


    it('should write a value', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "WRITE", "path": "plc/app/Application/sym/PLC_PRG/i", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg).to.have.property('payload').with.property('value').that.is.a('number').eql(23);
            expect(msg).to.have.property('payload').with.property('type').that.is.a('string').eql('int16');

            let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

            ctrlx.logIn()
              .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/i'))
              .then((data) => {
                expect(data).to.have.property('value').that.is.a('number').eql(23);
                expect(data).to.have.property('type').that.is.a('string').eql('int16');
                done();
              })
              .catch((err) => done(err))
              .finally(() => { ctrlx.logOut() });

          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: { type: 'int16', value: 23 } });
      });
    });


    it('should browse a node', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "BROWSE", "path": "framework/metrics/system", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg.payload).to.have.property('value').to.deep.equal(["cpu-utilisation-percent", "memavailable-mb", "membuffers-mb", "memcache-mb", "memfree-mb", "memtotal-mb", "memused-mb", "memused-percent"]);
            expect(msg.payload).to.have.property('type').to.equal('arstring');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" });
      });
    });


    it('should browse a node and return only values', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "BROWSE", "path": "framework/metrics/system", "name": "request", "payloadFormat": "value", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg.payload).to.deep.equal(["cpu-utilisation-percent", "memavailable-mb", "membuffers-mb", "memcache-mb", "memfree-mb", "memtotal-mb", "memused-mb", "memused-percent"]);

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" });
      });
    });


    it('should read metadata', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "METADATA", "path": "framework/metrics/system/cpu-utilisation-percent", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg.payload).to.have.property('nodeClass').to.equal('Resource');
            expect(msg.payload).to.have.property('description').to.be.a('string');
            expect(msg.payload).to.have.property('descriptionUrl').to.be.a('string');
            expect(msg.payload).to.have.property('displayName').to.be.a('string');
            expect(msg.payload).to.have.property('displayFormat').to.be.a('string');
            expect(msg.payload).to.have.property('unit').to.be.a('string');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" });
      });
    });


    it('should create a node', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "CREATE", "path": "motion/axs", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            expect(msg.payload).to.have.property('value').that.is.a('number');
            expect(msg.payload).to.have.property('type').that.is.a('string').eql('uint32');

            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: { type: 'string', value: 'nostromo' } });
      });
    });


    it('should delete a node', function (done) {

      let flow = [
        { "id": "h1", "type": "helper" },
        { "id": "n1", "type": "ctrlx-datalayer-request", "device": "c1", "method": "DELETE", "path": "motion/axs/nostromo", "name": "request", "wires": [["h1"]] },
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, () => {

        let n1 = helper.getNode("n1");
        let h1 = helper.getNode("h1");

        // @ts-ignore
        h1.on("input", (msg) => {
          try {
            // payload is just pass through
            expect(msg.payload).to.have.property('value').that.is.a('string').eql('nostromo');
            expect(msg.payload).to.have.property('type').that.is.a('string').eql('string');
            done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: { type: 'string', value: 'nostromo' } });
      });
    });

  });



});
