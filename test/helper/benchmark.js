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
'use strict'

const CtrlxCore = require('../../lib/CtrlxCore')
const {performance, PerformanceObserver} = require('perf_hooks')
const async = require('async');
const { assert } = require('console');




//
// Test Connection
//
function getHostname() {
  return process.env.TEST_HOSTNAME || '[fe80::260:34ff:fe08:322]';
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
    .catch((err) => {console.error(err)})
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

  let ctrlx = new CtrlxCore('[fe80::260:34ff:fe08:322]', 'boschrexroth', 'boschrexroth');

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

  } catch(err) {
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
    async.map(paths, performRead, function (err, res) {
      performance.mark('B');
      performance.measure('Complete Loop', 'A', 'B');

      assert(res.every((val) => {return val.value === true;}));
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

exports.benchmarkSimple = benchmarkSimple;
exports.benchmarkSimpleAsync = benchmarkSimpleAsync;
exports.benchmarkRequestsPerSecond = benchmarkRequestsPerSecond;

//benchmarkSimple()
//benchmarkSimpleAsync();
//benchmarkRequestsPerSecond()
