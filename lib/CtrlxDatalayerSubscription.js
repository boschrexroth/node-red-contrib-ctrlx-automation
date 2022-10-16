/**
 *
 * MIT License
 *
 * Copyright (c) 2020-2022 Bosch Rexroth AG
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

// @ts-ignore
const net = require('net');
const EventSource = require('launchdarkly-eventsource').EventSource;
const EventEmitter = require("events").EventEmitter;
const CtrlxDatalayer = require('./CtrlxDatalayerV2');
const CtrlxProblemError = require('../lib/CtrlxProblemError');
const debug = require('debug')('ctrlxcore:datalayer:subscription');
const debugUpdate = require('debug')('ctrlxcore:datalayer:subscription:update');


/**
 * This class encapsulates a Data Layer subscription which can be used to subscribe to
 * one or more Data Layer Nodes and to get notified on value change.
 * The subscription is mapped to the HTML5 server-sent event mechanism (https://en.wikipedia.org/wiki/Server-sent_events).
 * This class works as a facade around the EventSource interface (https://www.w3.org/TR/eventsource/).
 *
 * @example <caption>Example how to subscribe and print the updates.</caption>
 * let subscription = new CtrlxDatalayerSubscription('192.168.1.1', 443, '', 'Bearer ABCD1234', ['framework/metrics/system/cpu-utilisation-percent']);
 *
 * subscription.open((err, sub) => {
 *   if (err) throw err;
 *
 *   sub.on('update', (data) => {
 *     console.log(JSON.stringify(data));
 *   });
 * });
 *
*/
class CtrlxDatalayerSubscription extends EventEmitter {


  /**
   * Creates an instance of CtrlxDatalayerSubscription.
   *
   * @param {string} hostname - The hostname of the device. Can also be an ipv4-, ipv6-address or 'localhost'.
   * @param {number} port - The port number of the device, where the web server is listening. Usually 443.
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} authorization - The authorization token string for the http header.
   * @param {string[]} paths - An array of node addresses to subscribe to.
   * @param {number|undefined} publishIntervalMs - The interval in milliseconds that is requested as update interval from the server.
   *                                               If omitted, then the server will chose a default value (usually 1s).
   * @memberof CtrlxCore
   */
  constructor(hostname, port = 443, servername = '', authorization, paths, publishIntervalMs = undefined) {
    debug(`constructor(${hostname}, ...)`);
    super();

    this._hostname = hostname;
    this._isIPv6 = net.isIPv6(this._hostname);
    this._port = port;
    this._servername = servername;
    this._authorization = authorization;
    this._nodes = paths;
    this._publishIntervalMs = publishIntervalMs;
    this._noInternalReconnect = false;
    this._es = null;
  }



  /* ---------------------------------------------------------------------------
   * Public Methods
   * -------------------------------------------------------------------------*/

  /**
   * The interval in milliseconds that is requested as update interval from the server.
   *
   * @memberof CtrlxCore
   */
  get publishIntervalMs() {
    return this._publishIntervalMs;
  }

  /**
   * Opens an event stream and starts the subscription.
   *
   * @param {function} callback(err, this) - Will be called after session has been established. On success a reference to the instance is returned.
   * @memberof CtrlxDatalayerSubscription
   */
  open(callback) {
    debug('open()');

    if (this._es) {
      callback(new Error('Subscription already open. Call close() first before reopening.'));
      return;
    }

    // Arguments are given as query parameter.
    // IPv6: We have to use IPv6 square brackets for valid url
    let urlhostname = this._isIPv6 ? '[' + this._hostname + ']' : this._hostname;
    let url = `https://${urlhostname}:${this._port}/automation/api/v2/events?nodes=` + encodeURIComponent(this._nodes.toString());
    if (typeof this._publishIntervalMs !== 'undefined') {
      url += `&publishIntervalMs=${this._publishIntervalMs}`;
    }

    // Subscriptions are delivered with server-sent-events (https://www.w3.org/TR/eventsource/).
    // To establish an event stream we use the standardized EventSource class.
    let sub = this;
    const eventSourceInitDict = {
      hostname: this._hostname,                 // sets the hostname (without enclosing brackets) for enabling IPv6 support on linux
      initialRetryDelayMillis: 1000,            // sets initial retry delay to 1 seconds
      maxBackoffMillis: 10000,                  // enables backoff, with a maximum of 10 seconds
      retryResetIntervalMillis: 60000,          // backoff will reset to initial level if stream got an event at least 60 seconds before failing
      jitterRatio: 0.5,                         // each delay will be reduced by a randomized jitter of up to 50%
      https: {
        rejectUnauthorized: false,              // causes requests to succeed even if the certificate cannot be validated
        servername: this._servername,
      },
      headers: {
        'Authorization': this._authorization,   // forward the authorization token
      },
      errorFilter: function(e) {                // note: will be called for e.type='error' as well as e.type='end'
        // will try reconnect on true.
        if (sub._noInternalReconnect) {
          return false;                         // reconnect of lib is disabled. Has to be handled by caller
        } else {
          return e.status !== 401;              // always try reconnect, except for authorization problems
        }
      }
    };

    // The EventSource object holds the connection to the server.
    // For nodejs we use the implementation from: https://github.com/launchdarkly/js-eventsource
    let es = new EventSource(url, eventSourceInitDict)

    // Called when creation of eventstream failed
    // @ts-ignore
    es.onerror = (err) => {
      debug(`open() ERROR(${err.message})`);
      es.onopen = undefined;
      es.onclose = undefined;
      es.close();
      this._es = null;

      if (err) {
        callback(err, null);
      } else {
        callback(new Error('Unknown error on creation of subscription'), null);
      }
    };

    // Called when creation of eventstream was successful
    // @ts-ignore
    es.onopen = () => {
      debug('open() DONE');
      this._es = es;

      // @ts-ignore
      this._es.onopen = () => {
        debug('onopen()');
      };

      // @ts-ignore
      this._es.onclosed = () => {
        debug('onclosed()');

        if (this.listeners('closed').length > 0) {
          this.emit('closed');
        }
      };

      // @ts-ignore
      this._es.onend = () => {
        debug('onend()');

        if (this.listeners('end').length > 0) {
          this.emit('end');
        }
      };

      // @ts-ignore
      this._es.onretrying = (e) => {
        debug(`onretrying(${e.delayMilis} ms)`);
      };

      // @ts-ignore
      this._es.onerror = (e) => {
        debug(`onerror(${e.type})`);

        if (typeof e.data !== 'undefined') {

          // The error is of type 'MessageEvent'. This means, that not the stream has an error, but
          // an 'error' message is send over the stream (in contrast to an 'update' message if everything is fine).
          // This could mean, that one of the subscribed nodes might have a problem.
          // For a 'MessageEvent' of type 'error', we expect a 'Problem' object to be transferred in the 'data' element.
          let err = CtrlxProblemError.fromHttpResponse(e.data.status, e.data);

          if (this.listeners('error').length > 0) {
            this.emit('error', err);
          }

        } else {

          // The error is of type Event or Error. The subscription might be broken.
          if (this.listeners('error').length > 0) {
            this.emit('error', e);
          }

        }

      };

      this._es.addEventListener('update', (e) => {
        if (debugUpdate.enabled) {
          debugUpdate(`update(${e.data})`);
        }

        let payload = CtrlxDatalayer._parseData(e.data);

        if (!this.emit('update', payload, e.lastEventId)) {
          // Listener seems not yet to be attached. Retry on next tick.
          setTimeout(() => this.emit('update', payload, e.lastEventId), 0);
        }
      });

      callback(null, this);
    };
  }


  /**
   * Closes the event stream and stops the subscription.
   *
   * @memberof CtrlxDatalayerSubscription
   */
  close() {
    debug('close()');
    if (this._es) {
      // this._es.removeEventListener('update');
      // @ts-ignore
      this._es.onopen = undefined;
      // @ts-ignore
      this._es.onclose = undefined;
      // @ts-ignore
      this._es.onend = undefined;
      // @ts-ignore
      this._es.onretrying = undefined;
      // @ts-ignore
      this._es.onerror = undefined;
      // @ts-ignore
      this._es.onmessage = undefined;
      this._es.close();
      this._es = null;
    }
  }




  /* ---------------------------------------------------------------------------
   * Static Methods
   * -------------------------------------------------------------------------*/

  /**
   * Converts the timestamp as given in the sse-stream into the timestamp format used in javascript.
   *
   * @static
   * @param {number} timestamp as returned in the "data:" object of the server sent event stream.
   * @return {number} number of milliseconds from Jan 1, 1970.
   * @memberof CtrlxDatalayerSubscription
   */
  static convertTimestamp2Javascript(timestamp) {
    // Convert from FILETIME (100-nanosecond intervals since January 1, 1601 UTC) to
    // number of milliseconds from Jan 1, 1970.
    // Between Jan 1, 1601 and Jan 1, 1970 there are 11644473600 seconds
    return (Math.round(timestamp / 10000) - 11644473600000);
  }

  /**
   * Converts the timestamp as given in the sse-stream into a javascript Date object.
   *
   * @static
   * @param {number} timestamp as returned in the "data:" object of the server sent event stream.
   * @return {Date} Javascript Date Object.
   * @memberof CtrlxDatalayerSubscription
   */
  static convertTimestamp2Date(timestamp) {
    return new Date(CtrlxDatalayerSubscription.convertTimestamp2Javascript(timestamp));
  }

}

module.exports = CtrlxDatalayerSubscription;
