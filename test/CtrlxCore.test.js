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


const net = require('net');
const expect = require('chai').expect;
const CtrlxCore = require('../lib/CtrlxCore')
const CtrlxDatalayer = require('../lib/CtrlxDatalayerV2')



/*
 * This test group contains basic test cases
 */
describe('CtrlxCore', function() {

  function getHostname() {
    return process.env.TEST_HOSTNAME || 'localhost';
  }
  function getUsername() {
    return process.env.TEST_USERNAME || 'boschrexroth';
  }
  function getPassword() {
    return process.env.TEST_PASSWORD || 'boschrexroth';
  }



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

    it('should have a working hostname:port parser', function(done) {

      // IPv4
      expect(CtrlxCore._parseHost('127.0.0.1')).to.deep.equal({ 'hostname': '127.0.0.1', 'port': 443 })

      // IPv6
      expect(net.isIPv6('::1')).to.equal(true)
      expect(net.isIPv6('::1%eth0')).to.equal(true)
      expect(net.isIPv6('fe80::260:34ff:fe08:db2')).to.equal(true)
      expect(net.isIPv6('fe80::260:34ff:fe08:db2%eth0')).to.equal(true)

      expect(CtrlxCore._parseHost('fe80::260:34ff:fe08:db2')).to.deep.equal({ 'hostname': 'fe80::260:34ff:fe08:db2', 'port': 443 })
      expect(CtrlxCore._parseHost('[fe80::260:34ff:fe08:db2]')).to.deep.equal({ 'hostname': 'fe80::260:34ff:fe08:db2', 'port': 443 })
      expect(CtrlxCore._parseHost('[fe80::260:34ff:fe08:db2]:8443')).to.deep.equal({ 'hostname': 'fe80::260:34ff:fe08:db2', 'port': 8443 })

      expect(CtrlxCore._parseHost('fe80::260:34ff:fe08:db2%eth0')).to.deep.equal({ 'hostname': 'fe80::260:34ff:fe08:db2%eth0', 'port': 443 })
      expect(CtrlxCore._parseHost('[fe80::260:34ff:fe08:db2%eth0]')).to.deep.equal({ 'hostname': 'fe80::260:34ff:fe08:db2%eth0', 'port': 443 })
      expect(CtrlxCore._parseHost('[fe80::260:34ff:fe08:db2%eth0]:8443')).to.deep.equal({ 'hostname': 'fe80::260:34ff:fe08:db2%eth0', 'port': 8443 })

      expect(CtrlxCore._parseHost('::1')).to.deep.equal({ 'hostname': '::1', 'port': 443 })
      expect(CtrlxCore._parseHost('[::1]')).to.deep.equal({ 'hostname': '::1', 'port': 443 })
      expect(CtrlxCore._parseHost('[::1]:8443')).to.deep.equal({ 'hostname': '::1', 'port': 8443 })

      // domain: localhost
      expect(CtrlxCore._parseHost('localhost')).to.deep.equal({ 'hostname': 'localhost', 'port': 443 })
      expect(CtrlxCore._parseHost('LOCALHOST')).to.deep.equal({ 'hostname': 'localhost', 'port': 443 })
      expect(CtrlxCore._parseHost('LoCaLhOsT')).to.deep.equal({ 'hostname': 'localhost', 'port': 443 })

      // domain: localhost:port
      expect(CtrlxCore._parseHost('localhost:443')).to.deep.equal({ 'hostname': 'localhost', 'port': 443 })
      expect(CtrlxCore._parseHost('localhost:8443')).to.deep.equal({ 'hostname': 'localhost', 'port': 8443 })

      // domain: other
      expect(CtrlxCore._parseHost('ctrlx-server.com')).to.deep.equal({ 'hostname': 'ctrlx-server.com', 'port': 443 })
      expect(CtrlxCore._parseHost('ctrlx-server.com:8443')).to.deep.equal({ 'hostname': 'ctrlx-server.com', 'port': 8443 })

      // domain with trailing slash(es)
      expect(CtrlxCore._parseHost('ctrlx-server.com/')).to.deep.equal({ 'hostname': 'ctrlx-server.com', 'port': 443 })
      expect(CtrlxCore._parseHost('ctrlx-server.com//')).to.deep.equal({ 'hostname': 'ctrlx-server.com', 'port': 443 })
      expect(CtrlxCore._parseHost('ctrlx-server.com///')).to.deep.equal({ 'hostname': 'ctrlx-server.com', 'port': 443 })
      expect(CtrlxCore._parseHost('https://ctrlx-server.com/')).to.deep.equal({ 'hostname': 'ctrlx-server.com', 'port': 443 })

      done();
    });

    it('should parse BigInt', function(done) {

      expect(CtrlxDatalayer._parseData(`{"type": "int64", "value": 9223372036854775807}`).value).to.equal(BigInt(9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "int64", "value":-9223372036854775807}`).value).to.equal(BigInt(-9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "int64", "value":9223372036854775807}`).value).to.equal(BigInt(9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "int64", "value":9223372036854775807  }`).value).to.equal(BigInt(9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"value":9223372036854775807, "type": "int64"}`).value).to.equal(BigInt(9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "uint64", "value":9223372036854775807}`).value).to.equal(BigInt(9223372036854775807n))

      expect(CtrlxDatalayer._parseData(`{"type": "arint64", "value": [9223372036854775807]}`).value[0]).to.equal(BigInt(9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "arint64", "value": [-9223372036854775807]}`).value[0]).to.equal(BigInt(-9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "arint64", "value": [-9223372036854775807, 9223372036854775807]}`).value).to.deep.equal([BigInt(-9223372036854775807n), BigInt(9223372036854775807n)])
      expect(CtrlxDatalayer._parseData(`{"type": "arint64", "value": [9223372036854775807, 9223372036854775807, 1, 0, -1]}`).value).to.deep.equal([BigInt(9223372036854775807n), BigInt(9223372036854775807n), BigInt(1), BigInt(0), BigInt(-1)])
      expect(CtrlxDatalayer._parseData(`{"type": "arint64", "value": [ 9223372036854775807, 9223372036854775807 , 1 , 0 , -1 ]}`).value).to.deep.equal([BigInt(9223372036854775807n), BigInt(9223372036854775807n), BigInt(1), BigInt(0), BigInt(-1)])

      expect(CtrlxDatalayer._parseData(`{"type": "aruint64", "value": [9223372036854775807]}`).value[0]).to.equal(BigInt(9223372036854775807n))
      expect(CtrlxDatalayer._parseData(`{"type": "aruint64", "value": [9223372036854775807, 9223372036854775807, 1, 0]}`).value).to.deep.equal([BigInt(9223372036854775807n), BigInt(9223372036854775807n), BigInt(1), BigInt(0)])

      done();
    });

  });

});
