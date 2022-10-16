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


const assert = require('assert');
const expect = require('chai').expect;
const CtrlxCore = require('../lib/CtrlxCore')
const CtrlxProblemError = require('../lib/CtrlxProblemError')
const CtrlxMockup = require('./helper/CtrlxMockupV2')



/*
 * This test group contains test cases for acyclic access of the Data Layer via mapping
 * to REST protocol.
 */
describe('CtrlxCoreDataLayerNodes', function() {

  function getHostname() {
    return process.env.TEST_HOSTNAME || 'localhost';
  }
  function getUsername() {
    return process.env.TEST_USERNAME || 'boschrexroth';
  }
  function getPassword() {
    return process.env.TEST_PASSWORD || 'boschrexroth';
  }

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



  describe('CtrlxCore: Read/Write to Data Layer', function() {

    it('should return true when reading framework/bundles/com_boschrexroth_comm_datalayer/active', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => { return ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active'); })
        .then((data) => {
          assert.equal(data.value, true);
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should read two values and then logout without error', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active'))
        .then((/*data*/) => {/*console.log(data)*/ })
        .then(() => ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent'))
        .then((/*data*/) => { done(); /*console.log(data)*/ })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should read and write a value and then logout without error', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/i'))
        .then((data) => {
          assert.equal(data.value, 0);
          assert.equal(data.type, 'int16');
        })
        .then(() => ctrlx.datalayerWrite('plc/app/Application/sym/PLC_PRG/i', { type: 'int16', value: 23 }))
        .then((data) => {
          assert.equal(data.value, 23);
          assert.equal(data.type, 'int16');
        })
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/i'))
        .then((data) => {
          assert.equal(data.value, 23);
          assert.equal(data.type, 'int16');
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

    it('should read and write a string with Umlaut', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/str'))
        .then((data) => {
          assert.equal(data.value, 'vier');
          assert.equal(data.type, 'string');
        })
        .then(() => ctrlx.datalayerWrite('plc/app/Application/sym/PLC_PRG/str', { type: 'string', value: 'fünf' }))
        .then((data) => {
          assert.equal(data.value, 'fünf');
          assert.equal(data.type, 'string');
        })
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/str'))
        .then((data) => {
          assert.equal(data.value, 'fünf');
          assert.equal(data.type, 'string');
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

    it('should write a value with empty argument list', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerWrite('diagnosis/confirm/error', null))
        .then((data) => {
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

    it('should create a value with empty argument list', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerCreate('motion/axs/axisx/cmd/reset', null))
        .then((data) => {
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

    it('should read with arguments', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerRead('test/add', { 'type': 'object', 'value': { 'arg1': 17, 'arg2': 5 } }))
        .then((data) => {
          expect(data.type).to.equal('uint32');
          expect(data.value).to.equal(22);
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should read metadata', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerReadMetadata('framework/metrics/system/cpu-utilisation-percent'))
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

    it('should browse data layer', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerBrowse('framework/metrics/system'))
        .then((data) => {
          expect(data.value).to.deep.equal(["cpu-utilisation-percent", "memavailable-mb", "membuffers-mb", "memcache-mb", "memfree-mb", "memtotal-mb", "memused-mb", "memused-percent"]);
          expect(data.type).to.equal('arstring');
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should automatically logout() before new login() and be successfully logged in', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.logIn())
        .then((data) => {
          data.should.have.property('access_token').which.is.a.String();
          data.should.have.property('token_type').which.is.a.String().eql('Bearer');
        })
        .then(() => ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent'))
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
        .then(() => ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent'))
        .then((data) => {
          data.should.have.property('value').which.is.a.Number().within(0, 100);
          data.should.have.property('type').which.is.a.String().eql('double');
          testServer.sessionEstablished = false;
        })
        .then(() => ctrlx.datalayerWrite('plc/app/Application/sym/PLC_PRG/i', { type: 'int16', value: 23 }))
        .then((data) => {
          assert.equal(data.value, 23);
          assert.equal(data.type, 'int16');
        })
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/i'))
        .then((data) => {
          assert.equal(data.value, 23);
          assert.equal(data.type, 'int16');
          done();
        })
        .catch((err) => done(err))
        .finally(() => ctrlx.logOut());

    });

    it('should read and write a big integer value', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/i64'))
        .then((data) => {
          assert.strictEqual(data.value, BigInt(9223372036854775807n));
          assert.strictEqual(data.value.toString(), BigInt(9223372036854775807n).toString());
          assert.equal(data.type, 'int64');
        })
        .then(() => ctrlx.datalayerWrite('plc/app/Application/sym/PLC_PRG/i64', { type: 'int64', value: BigInt(9223372036854775899n) }))
        .then((data) => {
          assert.strictEqual(data.value, BigInt(9223372036854775899n));
          assert.strictEqual(data.value.toString(), BigInt(9223372036854775899n).toString());
          assert.equal(data.type, 'int64');
        })
        .then(() => ctrlx.datalayerRead('plc/app/Application/sym/PLC_PRG/i64'))
        .then((data) => {
          assert.strictEqual(data.value, BigInt(9223372036854775899n));
          assert.strictEqual(data.value.toString(), BigInt(9223372036854775899n).toString());
          assert.equal(data.type, 'int64');
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

  });






  describe('CtrlxCore: Create/Delete to Data Layer', function() {

    it('should create and delete a node and then logout without error', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerCreate('motion/axs', { "type": "string", "value": "nostromo" }))
        .then((data) => {
          data.should.have.property('value').which.is.a.Number();
          data.should.have.property('type').which.is.a.String().eql('uint32');
        })
        .then(() => ctrlx.datalayerDelete('motion/axs/nostromo'))
        .then(() => {
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

    it('should not crash when no response is returned on create', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn()
        .then(() => ctrlx.datalayerCreate('motion/axs/no/content', { "type": "string", "value": "nostromo" }))
        .then((data) => {
          assert.equal(data, undefined);
        })
        .then(() => {
          done();
        })
        .catch((err) => done(err))
        .finally(() => { ctrlx.logOut() });

    });

  });







  describe('CtrlxCore: Check correct error handling', function() {

    it('should return an error when not authenticated', function(done) {

      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent')
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
      ctrlx.datalayerReadMetadata('framework/metrics/system/cpu-utilisation-percent')
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
      ctrlx.datalayerWrite('framework/metrics/system/cpu-utilisation-percent', { value: '5', type: 'double' })
        .then((data) => done(new Error("should not reach this code. Expected error instead of: " + JSON.stringify(data))))
        .catch((err) => { assert.equal(err.name, 'Error'); })
        .finally(() => ctrlx.logOut());
      ctrlx.datalayerBrowse('framework/metrics/system/cpu-utilisation-percent')
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
        .then(() => ctrlx.datalayerReadMetadata('invalidnode'))
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
        .then(() => ctrlx.datalayerRead('nonexistent/path'))
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

          const message = err.toStringExtended();
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

    it('should return CtrlxProblemError type only if set', function() {

      let err = CtrlxProblemError.fromHttpStatuscode(404);
      expect(err.type).to.equal('about:blank');
      expect(err.toStringExtended()).to.not.include('about:blank');
      err._type = 'https://example.com/probs/out-of-credit';
      expect(err.toStringExtended()).to.include('https://example.com/probs/out-of-credit');
    });

  });

});



/*
 * This test group contains test cases for acyclic access of the Data Layer via mapping
 * to REST protocol.
 */

describe('CtrlxCoreDataLayerNodes - With different port', function() {

  function getHostname() {
    return process.env.TEST_HOSTNAME || 'localhost:8443';
  }
  function getUsername() {
    return process.env.TEST_USERNAME || 'boschrexroth';
  }
  function getPassword() {
    return process.env.TEST_PASSWORD || 'boschrexroth';
  }

  let testServer;
  before(function(done) {
    testServer = new CtrlxMockup();
    testServer.startServer('localhost', 8443, () => {
      done();
    });
  });

  after(function(done) {
    this.timeout(10000);
    testServer.stopServer(() => {
      done();
    });
  });

  it('should return true when reading framework/bundles/com_boschrexroth_comm_datalayer/active', function(done) {

    let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

    ctrlx.logIn()
      .then(() => { return ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active'); })
      .then((data) => {
        assert.equal(data.value, true);
        done();
      })
      .catch((err) => done(err))
      .finally(() => ctrlx.logOut());

  });

  it('should read two values and then logout without error', function(done) {

    let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

    ctrlx.logIn()
      .then(() => ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active'))
      .then((/*data*/) => {/*console.log(data)*/ })
      .then(() => ctrlx.datalayerRead('framework/metrics/system/cpu-utilisation-percent'))
      .then((/*data*/) => { done(); /*console.log(data)*/ })
      .catch((err) => done(err))
      .finally(() => ctrlx.logOut());

  });

});
