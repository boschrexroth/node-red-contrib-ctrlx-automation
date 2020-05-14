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
const expect = require('chai').expect;
const CtrlxCore = require('../lib/CtrlxCore')
const CtrlxProblemError = require('../lib/CtrlxProblemError')
const CtrlxMockup = require('./helper/CtrlxMockup')




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


  describe('CtrlxCore: Basics', function() {

    it('should have working properties', function(done) {
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      expect(ctrlx.autoReconnect).to.eql(false);
      ctrlx.autoReconnect = true;
      expect(ctrlx.autoReconnect).to.eql(true);

      expect(ctrlx.timeout).to.eql(-1);
      ctrlx.timeout = 23;
      expect(ctrlx.timeout).to.eql(23);

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

    it('should read and write a value and then logout without error', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.readDatalayer('plc/app/Application/sym/PLC_PRG/i'))
        .then((data) => {
            assert.equal(data.value, 0);
            assert.equal(data.type, 'int16');
          })
        .then(() => ctrlx.writeDatalayer('plc/app/Application/sym/PLC_PRG/i', {type:'int16', value: 23}))
        .then((data) => {
            assert.equal(data.value, 23);
            assert.equal(data.type, 'int16');
          })
        .then(() => ctrlx.readDatalayer('plc/app/Application/sym/PLC_PRG/i'))
        .then((data) => {
            assert.equal(data.value, 23);
            assert.equal(data.type, 'int16');
            done();
          })
        .catch((err) => done(err))
        .finally(() => {ctrlx.logOut()});

    });

    it('should read metadata', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.readDatalayerMetadata('framework/metrics/system/cpu-utilisation-percent') )
        .then((data) => {
          expect(data.nodeClass).to.equal('Resource');
          expect(data.description).to.be.a('string');
          expect(data.descriptionUrl).to.be.a('string');
          expect(data.displayName).to.be.a('string');
          expect(data.displayFormat).to.be.a('string');
          expect(data.unit).to.be.a('string');
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should read references', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.readDatalayerMetadata('framework/metrics/system/cpu-utilisation-percent') )
        .then((/*data*/) => {
          // TODO: check for valid references here
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should browse data layer', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.browseDatalayer('framework/metrics/system') )
        .then((data) => {
          expect(data.value).to.deep.equal(["cpu-utilisation-percent","memavailable-mb","membuffers-mb","memcache-mb","memfree-mb","memtotal-mb","memused-mb","memused-percent"]);
          expect(data.type).to.equal('arstring');
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should automatically logout() before new login() and be successfully logged in', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.logIn() )
        .then((data) => {
          data.should.have.property('access_token').which.is.a.String();
          data.should.have.property('token_type').which.is.a.String().eql('Bearer');
        })
        .then(() => ctrlx.readDatalayer('framework/metrics/system/cpu-utilisation-percent') )
        .then((data) => {
          data.should.have.property('value').which.is.a.Number().within(0, 100);
          data.should.have.property('type').which.is.a.String().eql('double');
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should automatically reconnect if session was closed by server', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());
      ctrlx.autoReconnect = true;

      ctrlx.logIn()
        .then((data) => {
          data.should.have.property('access_token').which.is.a.String();
          data.should.have.property('token_type').which.is.a.String().eql('Bearer');
          testServer.sessionEstablished = false;
        })
        .then(() => ctrlx.readDatalayer('framework/metrics/system/cpu-utilisation-percent') )
        .then((data) => {
          data.should.have.property('value').which.is.a.Number().within(0, 100);
          data.should.have.property('type').which.is.a.String().eql('double');
          testServer.sessionEstablished = false;
        })
        .then(() => ctrlx.writeDatalayer('plc/app/Application/sym/PLC_PRG/i', {type:'int16', value: 23}))
        .then((data) => {
          assert.equal(data.value, 23);
          assert.equal(data.type, 'int16');
        })
        .then(() => ctrlx.readDatalayer('plc/app/Application/sym/PLC_PRG/i'))
        .then((data) => {
          assert.equal(data.value, 23);
          assert.equal(data.type, 'int16');
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

  });




  describe('CtrlxCore: Check correct error handling', function() {

    it('should return an error when not authenticated', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.readDatalayer('framework/metrics/system/cpu-utilisation-percent')
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
       ctrlx.readDatalayerMetadata('framework/metrics/system/cpu-utilisation-percent')
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
       ctrlx.readDatalayerReferences('framework/metrics/system/cpu-utilisation-percent')
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
       ctrlx.writeDatalayer('framework/metrics/system/cpu-utilisation-percent', {value:'5', type: 'double'})
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
      ctrlx.browseDatalayer('framework/metrics/system/cpu-utilisation-percent')
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
      done();
    });


    it('should return an error on wrong username/password', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), 'xxx');

      ctrlx.logIn()
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => {
            assert.equal(err.name, 'CtrlxProblemError');
            assert.equal(err.status, 401);
            done();
          })
        .finally(() => ctrlx.logOut());

    });

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

    it('should return an error as CtrlxProblemError with additional problem properties', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.readDatalayer('nonexistent/path') )
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => {
            expect(err.name).equal('CtrlxProblemError');
            expect(err.title).to.be.a('string');
            expect(err.type).to.be.a('string').equal('about:blank');
            expect(err.severity).to.be.a('string').equal('ERROR');
            expect(err.type).to.be.a('string');
            expect(err.status).to.be.a('number').equal(404);
            expect(err.detail).to.be.a('string');
            expect(err.instance).to.be.a('string');
            expect(err.mainDiagnosisCode).to.be.a('string').with.length(8);
            expect(err.detailedDiagnosisCode).to.be.a('string').with.length(8);
            expect(err.dynamicDescription).to.be.a('string');

            var message = err.toStringExtended();
            expect(message).to.not.include('about:blank');
            expect(message).to.include(err.title);
            expect(message).to.include(err.severity);
            expect(message).to.include(err.detail);
            expect(message).to.include(err.mainDiagnosisCode);
            expect(message).to.include(err.detailedDiagnosisCode);

            done();
          })
        .finally(() => ctrlx.logOut());

    });

    it('should create a CtrlxProblemError from http status code', function() {

      let err = CtrlxProblemError.fromHttpStatuscode(404);
      expect(err.status).to.be.a('number').equal(404);
      expect(err.title).to.be.a('string').equal('[404] Not Found');
      expect(err.toStringExtended()).to.include('[404] Not Found');
    });

  });

});
