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


const expect = require('chai').expect;
const CtrlxCore = require('../lib/CtrlxCore')
const CtrlxDatalayerSubscription = require('../lib/CtrlxDatalayerSubscription');
const CtrlxMockup = require('./helper/CtrlxMockupV2')

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));



/*
 * This test group contains test cases for the subcription mechanism of the Data Layer
 * which is mapped to server sent events.
 */
describe('CtrlxCoreDataLayerEvents', function() {

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





  describe('CtrlxCoreSubscription: Subscription Interface', function() {


    it('should subscribe to a single node', async function() {
      this.timeout(5000);
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      try {

        await ctrlx.logIn();

        // Create the subscription
        let subscription = await ctrlx.datalayerSubscribe(['framework/metrics/system/cpu-utilisation-percent']);
        expect(subscription).to.exist;

        // Check and count the updates
        let numReceived = 0;
        subscription.on('update', (data) => {

          expect(data.node).to.be.a('string').eql('framework/metrics/system/cpu-utilisation-percent');
          expect(data.timestamp).to.be.a('number');
          expect(data.type).to.be.a('string').eql('double');
          expect(data.value).to.be.a('number').within(0, 100);

          const timestamp = CtrlxDatalayerSubscription.convertTimestamp2Date(data.timestamp);
          const deltaTime = Math.abs(timestamp.valueOf() - Date.now());
          expect(deltaTime).to.be.below(500);

          // console.log(`update: node=${data.node} value=${data.value} timestampUTC=${timestamp.toISOString()}`);
          numReceived++;
        });

        // Give some time to receive the updates
        await sleep(3000);
        subscription.close();

        // Check for the expected number of updates
        expect(numReceived).to.be.greaterThan(1);

      } catch (err) {
        console.error('Housten we are in trouble: ' + err);
        throw err;
      } finally {
        await ctrlx.logOut();
      }

    });


    it('should subscribe to a single node with escaped characters', function(done) {
      this.timeout(5000);
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      ctrlx.logIn().then(() => {
        // Create the subscription
        return ctrlx.datalayerSubscribe(['motion/axs/Axis_X/state/values/actual/acc/cm-per-s^2']);
      }).then((subscription) => {
        // Check and count the updates
        expect(subscription).to.exist;
        subscription.on('update', (data) => {

          expect(data.node).to.be.a('string').eql('motion/axs/Axis_X/state/values/actual/acc/cm-per-s^2');
          expect(data.timestamp).to.be.a('number');
          expect(data.type).to.be.a('string').eql('double');
          expect(data.value).to.be.a('number').eql(42);

          const timestamp = CtrlxDatalayerSubscription.convertTimestamp2Date(data.timestamp);
          const deltaTime = Math.abs(timestamp.valueOf() - Date.now());
          expect(deltaTime).to.be.below(500);

          subscription.close();
          done();
        });
      })
      .catch((err) => done(err))
      .finally(() => ctrlx.logOut());

    });


    it('should subscribe to multiple nodes', async function() {
      this.timeout(5000);
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      try {

        await ctrlx.logIn();

        // Create the subscription
        let subscription = await ctrlx.datalayerSubscribe(['framework/metrics/system/cpu-utilisation-percent', 'framework/bundles/com_boschrexroth_comm_datalayer/active']);
        expect(subscription).to.exist;

        // Check and count the updates
        let numReceived = 0;
        subscription.on('update', (data) => {

          expect(data.node).to.be.a('string').oneOf(['framework/metrics/system/cpu-utilisation-percent', 'framework/bundles/com_boschrexroth_comm_datalayer/active']);

          const timestamp = CtrlxDatalayerSubscription.convertTimestamp2Date(data.timestamp);
          const deltaTime = Math.abs(timestamp.valueOf() - Date.now());
          expect(deltaTime).to.be.below(500);

          // console.log(`update: node=${data.node} value=${data.value} timestampUTC=${timestamp.toISOString()}`);

          numReceived++;
        });

        // Give some time to receive the updates
        await sleep(3000);
        subscription.close();

        // Check for the expected number of updates
        expect(numReceived).to.be.greaterThan(3);

      } catch (err) {
        console.error('Housten we are in trouble: ' + err);
        throw err;
      } finally {
        await ctrlx.logOut();
      }

    });



    it('should subscribe with low publishInterval', async function() {
      this.timeout(5000);
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      try {

        await ctrlx.logIn();

        // Create the subscription
        let subscription = await ctrlx.datalayerSubscribe(['framework/metrics/system/cpu-utilisation-percent'], 100);
        expect(subscription).to.exist;
        expect(subscription.publishIntervalMs).to.be.a('number').eql(100);

        // Check and count the updates
        let numReceived = 0;
        subscription.on('update', (data) => {

          expect(data.node).to.be.a('string').eql('framework/metrics/system/cpu-utilisation-percent');
          expect(data.timestamp).to.be.a('number');
          expect(data.type).to.be.a('string').eql('double');
          expect(data.value).to.be.a('number').within(0, 100);

          const timestamp = CtrlxDatalayerSubscription.convertTimestamp2Date(data.timestamp);
          const deltaTime = Math.abs(timestamp.valueOf() - Date.now());
          expect(deltaTime).to.be.below(100);

          // console.log(`update: node=${data.node} value=${data.value} timestampUTC=${timestamp.toISOString()}`);
          numReceived++;
        });

        // Give some time to receive the updates
        await sleep(2000);
        subscription.close();

        // With a publishInterval of 100ms we might expect around 18 events within 2000ms.
        // We use a lower number to tolerate execution jitters.
        expect(numReceived).to.be.greaterThan(15);

      } catch (err) {
        console.error('Housten we are in trouble: ' + err);
        throw err;
      } finally {
        await ctrlx.logOut();
      }

    });


    it('should open a subscription only once', async function() {
      this.timeout(5000);
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      try {

        await ctrlx.logIn();

        // Create the subscription
        let subscription = await ctrlx.datalayerSubscribe(['framework/metrics/system/cpu-utilisation-percent'], 100);
        expect(subscription).to.exist;
        subscription.open((err) => {
          expect(err).to.be.an('error');
        });

        // Check and count the updates
        let numReceived = 0;
        subscription.on('update', (data) => {

          expect(data.node).to.be.a('string').eql('framework/metrics/system/cpu-utilisation-percent');
          numReceived++;
        });

        // Give some time to receive the updates
        await sleep(2000);
        subscription.close();

        expect(numReceived).to.be.greaterThan(0);

      } catch (err) {
        console.error('Housten we are in trouble: ' + err);
        throw err;
      } finally {
        await ctrlx.logOut();
      }

    });




  });

});



/*
 * This test group contains test cases for the subcription mechanism of the Data Layer
 * which is mapped to server sent events, but run on a different port.
 */
describe('CtrlxCoreDataLayerEvents - With different port', function() {

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


  describe('CtrlxCoreSubscription: Subscription Interface', function() {


    it('should subscribe to a single node', async function() {
      this.timeout(5000);
      let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());

      try {

        await ctrlx.logIn();

        // Create the subscription
        let subscription = await ctrlx.datalayerSubscribe(['framework/metrics/system/cpu-utilisation-percent']);
        expect(subscription).to.exist;

        // Check and count the updates
        let numReceived = 0;
        subscription.on('update', (data) => {

          expect(data.node).to.be.a('string').eql('framework/metrics/system/cpu-utilisation-percent');
          expect(data.timestamp).to.be.a('number');
          expect(data.type).to.be.a('string').eql('double');
          expect(data.value).to.be.a('number').within(0, 100);

          const timestamp = CtrlxDatalayerSubscription.convertTimestamp2Date(data.timestamp);
          const deltaTime = Math.abs(timestamp.valueOf() - Date.now());
          expect(deltaTime).to.be.below(500);

          // console.log(`update: node=${data.node} value=${data.value} timestampUTC=${timestamp.toISOString()}`);
          numReceived++;
        });

        // Give some time to receive the updates
        await sleep(3000);
        subscription.close();

        // Check for the expected number of updates
        expect(numReceived).to.be.greaterThan(1);

      } catch (err) {
        console.error('Housten we are in trouble: ' + err);
        throw err;
      } finally {
        await ctrlx.logOut();
      }
    });

  });

});
