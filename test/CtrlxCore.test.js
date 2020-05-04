/* eslint-disable no-undef */
const assert = require('assert');
const CtrlxCore = require('../lib/CtrlxCore')


const TEST_CONTROL_HOSTNAME ='[fe80::260:34ff:fe08:322]';
const TEST_CONTROL_USERNAME ='boschrexroth';
const TEST_CONTROL_PASSWORD ='boschrexroth';



describe('Simple tests with real control', () => {

  it('should return true when READing framework/bundles/com_boschrexroth_comm_datalayer/active', (done) => {

    let ctrlx = new CtrlxCore(TEST_CONTROL_HOSTNAME, TEST_CONTROL_USERNAME, TEST_CONTROL_PASSWORD);

    ctrlx.logIn()
      .then(() => { return ctrlx.readDatalayer('framework/bundles/com_boschrexroth_comm_datalayer/active'); })
      .then((data) => {assert.equal(data.value, true); done();})
      .catch((err) => done(err))
      .finally(() => ctrlx.logOut());

  });

  it('should read two values and then logout without error', () => {

    let ctrlx = new CtrlxCore(TEST_CONTROL_HOSTNAME, TEST_CONTROL_USERNAME, TEST_CONTROL_PASSWORD);

    ctrlx.logIn()
      .then(() => ctrlx.readDatalayer('framework/bundles/com_boschrexroth_comm_datalayer/active') )
      .then((data) => console.log(data))
      .then(() => ctrlx.readDatalayer('framework/metrics/system/cpu-utilisation-percent') )
      .then((data) => console.log(data))
      .catch((err) => console.error('Housten we are in trouble: ' + err))
      .finally(() => ctrlx.logOut());

  });

  it('should read two values and then logout without error', () => {

    let ctrlx = new CtrlxCore(TEST_CONTROL_HOSTNAME, TEST_CONTROL_USERNAME, TEST_CONTROL_PASSWORD);

    ctrlx.logIn()
      .then(() => ctrlx.readDatalayerMetadata('framework/bundles/com_boschrexroth_comm_datalayer/active') )
      .then((data) => console.log(data))
      .then(() => ctrlx.readDatalayerMetadata('framework/metrics/system/cpu-utilisation-percent') )
      .then((data) => console.log(data))
      .catch((err) => console.error('Housten we are in trouble: ' + err))
      .finally(() => ctrlx.logOut());

  });



});
