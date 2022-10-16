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
describe('ctrlx-config', function() {

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
  before(function(done) {
    testServer = new CtrlxMockup();
    testServer.startServer('localhost', CtrlxCore._parseHost(getHostname()).port, () => {
      done();
    });
  });
  after(function(done) {
    this.timeout(10000);
    testServer.stopServer(() => {
      done();
    });
  });


  // Prepare the Node-RED test framework
  beforeEach(function(done) {
    helper.startServer(done);
  });
  afterEach(function(done) {
    helper.unload().then(function() {
      helper.stopServer(done);
    });
  });



  describe('ctrlx-config: Basic Functionality', function() {


    it('should open a browse backend and return browse info', function(done) {

      let flow = [
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode], flow, credentials, () => {

        let c1 = helper.getNode("c1");
        expect(c1).to.have.property('name', 'ctrlx');
        expect(c1).to.have.property('hostname', getHostname());
        expect(c1).to.have.property('credentials').eql({
          username: getUsername(),
          password: getPassword()
        });

        helper.request()
          .get('/ctrlx/browse')
          .query({
            'username': getUsername(),
            'password': getPassword(),
            'hostname': getHostname(),
            'path': 'framework/metrics/system'
          })
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.text).eql('["cpu-utilisation-percent","memavailable-mb","membuffers-mb","memcache-mb","memfree-mb","memtotal-mb","memused-mb","memused-percent"]');
            done();
          });

      });
    });


    it('should open a browse backend by node.id and return browse info', function(done) {

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

            helper.request()
              .get('/ctrlx/browse')
              .query({
                'id': 'c1',
                'path': 'framework/metrics/system'
              })
              .expect(200)
              .end((err, res) => {
                if (err) {
                  return done(err);
                }
                expect(res.text).eql('["cpu-utilisation-percent","memavailable-mb","membuffers-mb","memcache-mb","memfree-mb","memtotal-mb","memused-mb","memused-percent"]');
                done();
              });

            // done();
          }
          catch (err) {
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" });



      });
    });



    it('should open a browse backend and return proper error', function(done) {

      let flow = [
        { "id": "c1", "type": "ctrlx-config", "name": "ctrlx", "hostname": getHostname(), "debug": true }
      ];
      let credentials = {
        c1: {
          username: getUsername(),
          password: getPassword()
        }
      };

      helper.load([ctrlxConfigNode], flow, credentials, () => {

        let c1 = helper.getNode("c1");
        expect(c1).to.have.property('name', 'ctrlx');
        expect(c1).to.have.property('hostname', getHostname());
        expect(c1).to.have.property('credentials').eql({
          username: getUsername(),
          password: getPassword()
        });

        helper.request().get('/ctrlx/browse').expect('[]', done);
      });
    });

  });


});
