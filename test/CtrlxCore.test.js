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


const assert = require('assert');
const CtrlxCore = require('../lib/CtrlxCore')
const CtrlxMockup = require('node-red-contrib-ctrlx-automation/test/helper/CtrlxMockup')




describe('CtrlxCore', function() {

  function getHostname() {
    return process.env.TEST_HOSTNAME || '127.0.0.1';
  }
  function getUsername() {
    return process.env.TEST_USERNAME || 'boschrexroth';
  }
  function getPassword() {
    return process.env.TEST_PASSWORD || 'boschrexroth';
  }

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




  describe('CtrlxCore: Read/Write to Data Layer', function() {

    it('should return true when reading framework/bundles/com_boschrexroth_comm_datalayer/active', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => { return ctrlx.readDatalayer('framework/bundles/com_boschrexroth_comm_datalayer/active'); })
        .then((data) => {assert.equal(data.value, true); done();})
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should read two values and then logout without error', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.readDatalayer('framework/bundles/com_boschrexroth_comm_datalayer/active') )
        .then((/*data*/) => {/*console.log(data)*/})
        .then(() => ctrlx.readDatalayer('framework/metrics/system/cpu-utilisation-percent') )
        .then((/*data*/) => {done(); /*console.log(data)*/})
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

  });




  describe('CtrlxCore: Check correct error handling', function() {

    it('should return an error as CtrlxProblemError', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.readDatalayerMetadata('invalidnode') )
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => {
            assert.equal(err.name, 'CtrlxProblemError');
            done();
          })
        .finally(() => ctrlx.logOut());

    });

  });

});
