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
const CtrlxMockup = require('./helper/CtrlxMockup')
const CtrlxCore = require('../lib/CtrlxCore')



describe('ctrlx-datalayer-request', function() {

  function getHostname() {
    return process.env.TEST_HOSTNAME || '127.0.0.1';
  }
  function getUsername() {
    return process.env.TEST_USERNAME || 'boschrexroth';
  }
  function getPassword() {
    return process.env.TEST_PASSWORD || 'boschrexroth';
  }

  // Prepare the ctrlX Device Server Mockup
  var testServer;
  before(function(done) {
    testServer = new CtrlxMockup();
    testServer.startServer(() => {
      done();
    });
  });
  after(function(done) {
    testServer.stopServer(() => {
      done();
    });
  });


  // Prepare the Node-RED test framework
  beforeEach(function(done) {
    helper.startServer(done);
  });
  afterEach(function (done) {
    helper.unload().then(function() {
      helper.stopServer(done);
    });
  });



  describe('ctrlx-datalayer-request: Basic Functionality', function() {

    it('should be loaded as imported by the flow', function(done) {

      let flow = [
        {"id":"h1","type":"helper"},
        {"id":"n1","type":"ctrlx-datalayer-request","device":"c1","method":"READ","path":"framework/metrics/system/cpu-utilisation-percent","name":"request","wires":[["h1"]]},
        {"id":"c1","type":"ctrlx-config","name":"ctrlx","hostname":"127.0.0.1","debug":true}
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
        c1.should.have.property('hostname', '127.0.0.1');
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


    it('should read a value', function(done) {

      let flow = [
        {"id":"h1","type":"helper"},
        {"id":"n1","type":"ctrlx-datalayer-request","device":"c1","method":"READ","path":"framework/metrics/system/cpu-utilisation-percent","name":"request","wires":[["h1"]]},
        {"id":"c1","type":"ctrlx-config","name":"ctrlx","hostname":getHostname(),"debug":true}
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
            msg.should.have.property('payload').with.property('value').which.is.a.Number().within(0, 100);
            msg.should.have.property('payload').with.property('type').which.is.a.String().eql('double');

            done();
          }
          catch(err){
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: "" });
      });
    });


    it('should write a value', function(done) {

      let flow = [
        {"id":"h1","type":"helper"},
        {"id":"n1","type":"ctrlx-datalayer-request","device":"c1","method":"WRITE","path":"plc/app/Application/sym/PLC_PRG/i","name":"request","wires":[["h1"]]},
        {"id":"c1","type":"ctrlx-config","name":"ctrlx","hostname":getHostname(),"debug":true}
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
            msg.should.have.property('payload').with.property('value').which.is.a.Number().eql(23);
            msg.should.have.property('payload').with.property('type').which.is.a.String().eql('int16');

            let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

            ctrlx.logIn()
              .then(() => ctrlx.readDatalayer('plc/app/Application/sym/PLC_PRG/i'))
              .then((data) => {
                  data.should.have.property('value').which.is.a.Number().eql(23);
                  data.should.have.property('type').which.is.a.String().eql('int16');
                  done();
                })
              .catch((err) => done(err))
              .finally(() => {ctrlx.logOut()});

          }
          catch(err){
            done(err);
          }
        });

        // @ts-ignore
        n1.receive({ payload: {type: 'int16', value: 23} });
      });
    });

  });

});
