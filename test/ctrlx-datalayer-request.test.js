/* eslint-disable no-undef */

// This test-helper module makes the node unit test framework from the Node-RED core available for node contributors.
// See:
// - https://github.com/node-red/node-red-node-test-helper
// - https://github.com/node-red/node-red/wiki/Testing
var helper = require("node-red-node-test-helper");


// The nodes to be tested
var ctrlxConfigNode = require("../ctrlx-config.js");
var ctrlxDatalayerRequestNode = require("../ctrlx-datalayer-request.js");


// To get started, we need to tell the helper where to find the node-red runtime. this is done by calling:
helper.init(require.resolve('node-red'));


describe('ctrlx-datalayer-request: Basic Functionality', function () {
  this.timeout(3000);

  beforeEach(function(done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(function() {
      helper.stopServer(done);
    });
  });




  it('should be loaded', function (done) {

    var flow = [
      {"id":"h1","type":"helper"},
      {"id":"n1","type":"ctrlx-datalayer-request","device":"c1","method":"READ","path":"framework/metrics/system/cpu-utilisation-percent","name":"request","wires":[["h1"]]},
      {"id":"c1","type":"ctrlx-config","name":"ctrlx","hostname":"[fe80::260:34ff:fe08:322]","debug":true}];
    var credentials = {
      c1: {
          username: "boschrexroth",
          password: "boschrexroth"
      }
    };

    helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, function () {

      var c1 = helper.getNode("c1");
      c1.should.have.property('name', 'ctrlx');
      c1.should.have.property('hostname', '[fe80::260:34ff:fe08:322]');
      c1.should.have.property('credentials', {
        username: "boschrexroth",
        password: "boschrexroth"
      });

      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'request');
      n1.should.have.property('method', 'READ');
      n1.should.have.property('path', 'framework/metrics/system/cpu-utilisation-percent');

      done();
    });
  });




  it('should read a value', function (done) {

    var flow = [
      {"id":"h1","type":"helper"},
      {"id":"n1","type":"ctrlx-datalayer-request","device":"c1","method":"READ","path":"framework/metrics/system/cpu-utilisation-percent","name":"request","wires":[["h1"]]},
      {"id":"c1","type":"ctrlx-config","name":"ctrlx","hostname":"[fe80::260:34ff:fe08:322]","debug":true}];
    var credentials = {
      c1: {
          username: "boschrexroth",
          password: "boschrexroth"
      }
    };

    helper.load([ctrlxConfigNode, ctrlxDatalayerRequestNode], flow, credentials, function () {

      var n1 = helper.getNode("n1");
      var h1 = helper.getNode("h1");

      h1.on("input", function (msg) {
        try {
          msg.should.have.property('payload').with.property('value').which.is.a.Number().within(0, 100);
          msg.should.have.property('payload').with.property('type').which.is.a.String().eql('double');

          done();
        }
        catch(err){
          done(err);
        }
      });

      n1.receive({ payload: "" });
    });
  });

});
