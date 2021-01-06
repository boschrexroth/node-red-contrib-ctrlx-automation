/**
 *
 * MIT License
 *
 * Copyright (c) 2020-2021, Bosch Rexroth AG
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
const EventSource = require('launchdarkly-eventsource').EventSource;
const EventEmitter = require("events").EventEmitter;
const debug = require('debug')('ctrlxcore:datalayer:subscription');
const debugUpdate = require('debug')('ctrlxcore:datalayer:subscription:update');


/**
 * This class encapsulates a Data Layer subscription which can be used to subscribe to
 * one or more Data Layer Nodes and to get notified on value change.
 * The subscription is mapped to the HTML5 server-sent event mechanism (https://en.wikipedia.org/wiki/Server-sent_events).
 * This class works as a facade around the EventSource interface (https://www.w3.org/TR/eventsource/).
 *
 * @example <caption>Example how to subscribe and print the updates.</caption>
 * let subscription = new CtrlxDatalayerSubscription('192.168.1.1', 'Bearer ABCD1234', ['framework/metrics/system/cpu-utilisation-percent']);
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
   * @param {string} hostname - The hostname of the device. Can also be a ipv4-, ipv6-address or 'localhost'.
   * @param {string} servername - The TLS servername of the device as defined by RFC 6066. Empty string in case of an ip-address.
   * @param {string} authorization - The authorization token string for the http header.
   * @param {string[]} paths - An array of node addresses to subscribe to.
   * @param {number|undefined} publishIntervalMs - The interval in milliseconds that is requested as update interval from the server.
   *                                               If omitted, then the server will chose a default value (usually 1s).
   * @memberof CtrlxCore
   */
  constructor(hostname, servername, authorization, paths, publishIntervalMs = undefined) {
    debug(`constructor(${hostname}, ...)`);
    super();

    this._hostname = hostname;
    this._servername = servername;
    this._authorization = authorization;
    this._nodes = paths;
    this._publishIntervalMs = publishIntervalMs;
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
    let url = `https://${this._hostname}:443/automation/api/v2/events?nodes=${this._nodes}`;
    if (typeof this._publishIntervalMs !== 'undefined') {
      url += `&publishIntervalMs=${this._publishIntervalMs}`;
    }

    // Subscriptions are delivered with server-sent-events (https://www.w3.org/TR/eventsource/).
    // To establish an event stream we use the standardized EventSource class.
    const eventSourceInitDict = {
      initialRetryDelayMillis: 2000,            // sets initial retry delay to 2 seconds
      maxBackoffMillis: 30000,                  // enables backoff, with a maximum of 30 seconds
      retryResetIntervalMillis: 60000,          // backoff will reset to initial level if stream got an event at least 60 seconds before failing
      jitterRatio: 0.5,                         // each delay will be reduced by a randomized jitter of up to 50%
      https: {
        rejectUnauthorized: false,              // causes requests to succeed even if the certificate cannot be validated
        servername: this._servername,
      },
      headers: {
        'Authorization': this._authorization,   // forward the authorization token
      },
      errorFilter: function(e) {
        return e.status !== 401;                // always try reconnect, except for authorization problems
      }
    };

    // The EventSource object holds the connection to the server.
    // For nodejs we use the implementation from: https://github.com/launchdarkly/js-eventsource
    let es = new EventSource(url, eventSourceInitDict)

    // Called when creation of eventstream failed
    // @ts-ignore
    es.onerror = (err) => {
      debug(`open() ERROR(${err.message})`);
      this._es = null;

      if (err) {
        callback(err, null);
      } else {
        callback(new Error('Unknown error on creation of subscription'), null);
      }
    };

    // Called when creation of eventstream was successful
    // @ts-ignore
    es.onopen = (/*e*/) => {
      debug('open() DONE');
      this._es = es;

      // @ts-ignore
      this._es.onopen = () => {
        debug('onopen()');
      };

      // @ts-ignore
      this._es.onclosed = () => {
        debug('onclosed()');
      };

      // @ts-ignore
      this._es.onend = () => {
        debug('onend()');
      };

      // @ts-ignore
      this._es.onretrying = (e) => {
        debug(`onretrying(${e.delayMilis} ms)`);
      };

      // @ts-ignore
      this._es.onerror = (err) => {
        debug(`onerror(${err.message})`);

        if (this.listeners('error').length > 0) {
          this.emit('error', err);
        }
      };

      this._es.addEventListener('update', (e) => {
        if (debugUpdate.enabled) {
          debugUpdate(`update(${e.data})`);
        }
        this.emit('update', JSON.parse(e.data), e.lastEventId);
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
      //this._es.removeEventListener('update');
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
   * Converts the timestamp as given in the sse-stream into a javascript Date object.
   *
   * @static
   * @param {number} timestamp as returned in the data: object of the server sent event stream.
   * @return {Date} Javascript Date Object.
   * @memberof CtrlxDatalayerSubscription
   */
  static convertTimestamp2Date(timestamp) {
    // Convert from FILETIME (100-nanosecond intervals since January 1, 1601 UTC) to
    // number of milliseconds from Jan 1, 1970.
    // Between Jan 1, 1601 and Jan 1, 1970 there are 11644473600 seconds
    return new Date(timestamp / 10000 - 11644473600000);
  }

}

module.exports = CtrlxDatalayerSubscription;
