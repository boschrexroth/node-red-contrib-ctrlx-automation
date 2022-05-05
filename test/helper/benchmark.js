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
'use strict'

const CtrlxCore = require('../../lib/CtrlxCore')
const { performance, PerformanceObserver } = require('perf_hooks')
const async = require('async');
const { assert } = require('console');




//
// Test Connection
//
function getHostname() {
  return process.env.TEST_HOSTNAME || '[fe80::260:34ff:fe08:db2]';
}
function getUsername() {
  return process.env.TEST_USERNAME || 'boschrexroth';
}
function getPassword() {
  return process.env.TEST_PASSWORD || 'boschrexroth';
}
let ctrlx = new CtrlxCore(getHostname(), getUsername(), getPassword());



//
// Performance Observer is used to make and printout timing measurements
//
const obs = new PerformanceObserver((items) => {
  const entry = items.getEntries()[0];
  console.log(`${entry.name}: ${entry.duration}`);

});
obs.observe({ entryTypes: ['measure'] });







/**
 * This is a very simple benchmark to check the latency of a few read requests. It is a rough indication
 * how fast a simple ad-hoc requests takes to execute.
 */
function benchmarkSimple() {

  performance.mark('A');
  ctrlx.logIn()
    .then(() => {
      performance.mark('B');
      return ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
    })
    .then(() => {
      performance.mark('C');
      return ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
    })
    .then(() => {
      performance.mark('D');
      return ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
    })
    .then((data) => {
      assert(data === true);
      performance.mark('E');
      performance.measure('Login', 'A', 'B');
      performance.measure('Read 1', 'B', 'C');
      performance.measure('Read 2', 'C', 'D');
      performance.measure('Read 3', 'D', 'E');
    })
    .catch((err) => { console.error(err) })
    .finally(() => {
      ctrlx.logOut()
      performance.clearMarks();
    });

}


/**
 * This is a very simple benchmark to check the latency of a few read requests. It is a rough indication
 * how fast a simple ad-hoc requests takes to execute.
 */
async function benchmarkSimpleAsync() {

  try {

    performance.mark('A');
    await ctrlx.logIn();
    performance.mark('B');
    await ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
    performance.mark('C');
    await ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
    performance.mark('D');
    await ctrlx.datalayerRead('framework/bundles/com_boschrexroth_comm_datalayer/active');
    performance.mark('E');
    performance.measure('Login', 'A', 'B');
    performance.measure('Read 1', 'B', 'C');
    performance.measure('Read 2', 'C', 'D');
    performance.measure('Read 3', 'D', 'E');

  } catch (err) {
    console.error('Housten we are in trouble: ' + err);
  } finally {
    await ctrlx.logOut();
  }

  console.log('DONE!');
}


/**
 * This benchmark sends a bunch of requests in a loop as fast as possible and measures the overall time
 * it takes to execute this loop of requests.
 */
function benchmarkRequestsPerSecond() {

  // This is our iteratee, that we want to benchmark
  function performRead(path, callback) {

    ctrlx.datalayerRead(path)
      .then((data) => {
        callback(null, data);
      }).catch((err) => {
        callback(err);
      });

  }

  // Let's create some requests in an array, that we later loop over.
  const paths = [];
  for (let i = 0; i < 1000; i++) {
    paths.push('framework/bundles/com_boschrexroth_comm_datalayer/active')
  }

  // We need to login, before we can start our benchmark measurements
  ctrlx.logIn()
    .then(() => {

      // loop over asynchronous function and look how long it takes to get a result
      performance.mark('A');
      async.map(paths, performRead, function(err, res) {
        performance.mark('B');
        performance.measure('Complete Loop', 'A', 'B');

        assert(res.every((val) => { return val.value === true; }));
        if (err) {
          console.log('Async map failed with error:')
          console.log(err);
          return;
        }

        console.log('DONE!');
        ctrlx.logOut();
      })

    })

}


/**
 * A simple benchmark to measure creation of a subscription and how long it takes to return the first event.
 */
async function benchmarkSubscriptionSimple() {

  const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

  try {

    await ctrlx.logIn();

    performance.mark('A');
    let sub = await ctrlx.datalayerSubscribe('framework/metrics/system/cpu-utilisation-percent');
    performance.mark('B');

    sub.on('update', (data) => {
      performance.mark('C');
      console.log(JSON.stringify(data));
    });

    await sleep(4000);

    performance.measure('Create Subscription', 'A', 'B');
    performance.measure('First update', 'B', 'C');

    sub.close();
  } catch (err) {
    console.error('Housten we are in trouble: ' + err);
  } finally {
    await ctrlx.logOut();
  }

  console.log('DONE!');
}


/**
 * For simple tests...
 */
async function test() {

  try {

    await ctrlx.logIn();

    let fFieldbus = await ctrlx.datalayerRead(
      'fieldbuses/ethercat/master/instances/ethercatmaster/device_access/slave_online_info',
      {
        "type": "object",
        "value": { "request": { "addressType": "fixedphysical", "address": 1001 } }
      });

    console.log(JSON.stringify(fFieldbus));

  } catch (err) {
    console.error('Housten we are in trouble: ' + err);
  } finally {
    await ctrlx.logOut();
  }

  console.log('DONE!');

}




exports.benchmarkSimple = benchmarkSimple;
exports.benchmarkSimpleAsync = benchmarkSimpleAsync;
exports.benchmarkRequestsPerSecond = benchmarkRequestsPerSecond;
exports.benchmarkSubscriptionSimple = benchmarkSubscriptionSimple;

// benchmarkSimple()
// benchmarkSimpleAsync();
// benchmarkRequestsPerSecond()
// benchmarkSubscriptionSimple();
// test();
