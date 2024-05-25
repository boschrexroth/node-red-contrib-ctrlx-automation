/**
 *
 * MIT License
 *
 * Copyright (c) 2020-2024 Bosch Rexroth AG
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
const https = require('https');
const EventSource = require('launchdarkly-eventsource').EventSource;
const EventEmitter = require("events").EventEmitter;
const { v4: uuidv4 } = require('uuid');

const CtrlxProblemError = require('../lib/CtrlxProblemError');
const CtrlxDatalayer = require('./CtrlxDatalayerV2');

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
   * @param {object} options - Additional configuration options for the subscription. (undefined = Server-side Data Layer defaults)
   *                          'publishIntervalMs': Interval for telegram transmission of new values.
   *                          'samplingIntervalUs': Server side sampling interval for new values.
   *                          'errorIntervalMs': Interval for telegram transmission of error states.
   *                          'keepaliveIntervalMs': Keepalive interval for server to send heartbeats to detect broken connection.
   *                          'queueSize': Size of queue for new values between publish intervals.
   *                          'queueBehaviour': Either 'DiscardOldest' or 'DiscardNewest'
   *                          'deadbandValue': Deadband value for value changes on numeric values.
   *
   * @memberof CtrlxCore
   */
  constructor(hostname, port = 443, servername = '', authorization, paths, options = {}) {
    debug(`constructor(${hostname}, ...)`);
    super();

    // Connection settings
    this._hostname = hostname;
    this._isIPv6 = net.isIPv6(this._hostname);
    this._port = port;
    this._servername = servername;
    this._authorization = authorization;

    // Subscription properties
    this._nodes = paths;
    this._publishIntervalMs = options.publishIntervalMs;
    this._keepaliveIntervalMs = options.keepaliveIntervalMs;
    this._errorIntervalMs = options.errorIntervalMs;
    this._samplingIntervalUs = options.samplingIntervalUs;
    this._queueSize = options.queueSize;
    this._queueBehaviour = options.queueBehaviour;
    this._deadbandValue = options.deadbandValue;

    // SSE states and settings
    this._es = null;
    this._timeout = 0;            // http timeout in ms, (0 = no timeout)
    this._noInternalReconnect = true;
    this._isEndByServer = false;
  }

  /* ---------------------------------------------------------------------------
  * Private Helper Methods
  * -------------------------------------------------------------------------*/

  /**
   * Helper function which will create a new subscription and return the URL where the subscription
   * can be started and opened for an SSE stream. The properties of the subscription are given in the body.
   * This way of creating a subscription is an alternative to creating the subscription implicitly by opening
   * an SSE stream and passing the properties as part of the URL. (i.e.: let url = `https://${this._hostname}:443/automation/api/v2/events?nodes=${this._nodes}`).
   *
   * Every call will create a new subscription using a UUID.
   *
   * @param {function} callback(err, url) - Returns an error or the URL where the SSE stream can be started. URL is valid for 60 seconds.
   * @memberof CtrlxDatalayerSubscription
   */
  _createSubscription(callback) {
    debug('_createSubscription()');

    // Use a UUID to create a new subscription
    const id = `node-red-${uuidv4()}`;

    // Some options are encoded as rules
    let rules = [];
    if (this._samplingIntervalUs) {
      rules.push({
        'rule_type': 'Sampling',
        'rule': {
          'samplingInterval': this._samplingIntervalUs
        }
      });
    }
    if (this._queueBehaviour && this._queueSize) {
      rules.push({
        'rule_type': 'Queueing',
        'rule': {
          'behaviour': this._queueBehaviour,
          'queueSize': this._queueSize
        }
      });
    }
    if (this._deadbandValue) {
      rules.push({
        'rule_type': 'DataChangeFilter',
        'rule': {
          'deadBandValue': this._deadbandValue
        }
      });
    }

    // Some options are encoded as properties
    let properties = {
      'id': id,
    }
    if (this._keepaliveIntervalMs) {
      properties['keepaliveInterval'] = this._keepaliveIntervalMs;
    }
    if (this._publishIntervalMs) {
      properties['publishInterval'] = this._publishIntervalMs;
    }
    if (this._errorIntervalMs) {
      properties['errorInterval'] = this._errorIntervalMs;
    }
    if (rules.length) {
      properties['rules'] = rules;
    }

    // All subscription settings are transmitted as payload
    const settings = {
      'properties': properties,
			'nodes': this._nodes,
    };

    let options = {
      hostname: this._hostname,
      servername: this._servername,
      port: this._port,
      path: encodeURI('/automation/api/v2/events/'),
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': this._authorization,
        'Connection': 'keep-alive',
        },
      rejectUnauthorized: false   // accept self-signed certificates
    };

    // Payload contains properties of requested subscription
    const postData = JSON.stringify(settings);
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(postData);

    if (this._timeout >= 0) {
      options.timeout = this._timeout;
    }

    const req = https.request(options, (res) => {
      let data = "";

      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {

        // We expect 200, 201 or 204 on success
        if (res.statusCode !== 200 && res.statusCode !== 201 && res.statusCode !== 204) {
          const err = CtrlxProblemError.fromHttpResponse(res, data);
          debug(`_createSubscription() ERROR`, err);
          callback(err);
          return;
        }

        // No error, return the url to the subscription. Url will be valid for 60 seconds.
        // IPv6: We have to use IPv6 square brackets for valid url and need to encode the hostname because an optional ipv6 zone index in the hostname
        //       might contain a `%`, which needs to be encoded to `%25`.
        const urlhostname = this._isIPv6 ? '[' + encodeURI(this._hostname) + ']' : this._hostname;
        const url = `https://${urlhostname}:${this._port}/automation/api/v2/events/${id}`;

        debug(`_createSubscription() DONE -> ${url}`);
        callback(null, url);
      });
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.on('error', (err) => {
      debug(`_createSubscription() ERROR`, err);
      callback(err);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
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
   * Returns true if the stream was ended by server (indicated by the 'end' event of the SSE handler).
   * Note, that this returns also false as long as no connection has been established.
   *
   * @memberof CtrlxCore
   */
    get isEndByServer() {
      return this._isEndByServer;
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

    // Create the subscription. On success, we will get the URL of the SSE stream.
    // The subscription will be started as soon as we GET on the URL. Otherwise the subscription will be deleted within 60 seconds.
    this._createSubscription((err, url) => {

      if (err) {
        callback(err);
        return;
      }

      // Subscriptions are delivered with server-sent-events (https://www.w3.org/TR/eventsource/).
      // To establish an event stream we use the standardized EventSource class.
      let sub = this;
      let eventSourceInitDict = {
        hostname: this._hostname,                     // sets the hostname (without enclosing brackets) for enabling IPv6 support on linux
        initialRetryDelayMillis: 1000,                // sets initial retry delay to 1 seconds
        maxBackoffMillis: 10000,                      // enables backoff, with a maximum of 10 seconds
        retryResetIntervalMillis: 60000,              // backoff will reset to initial level if stream got an event at least 60 seconds before failing
        jitterRatio: 0.5,                             // each delay will be reduced by a randomized jitter of up to 50%
        https: {
          rejectUnauthorized: false,                  // causes requests to succeed even if the certificate cannot be validated
          servername: this._servername
        },
        headers: {
          'Authorization': this._authorization,       // forward the authorization token
        },
        errorFilter: function(e) {                    // note: will be called for e.type='error' as well as e.type='end'
          // will try reconnect on true.
          if (sub._noInternalReconnect) {
            return false;                             // reconnect of lib is disabled. Has to be handled by caller
          } else {
            return e.status !== 401;                  // always try reconnect, except for authorization problems
          }
        },
        agent: new https.Agent({ keepAlive: false })  // create a dedicated agent to have dedicated connection instance. Also disable the agent-keep-alive explicitly.
                                                      // This is necessary because since node.js 19 the default behaviour was changed.
                                                      // https://nodejs.org/en/blog/announcements/v19-release-announce#https11-keepalive-by-default
      };

      if (this._keepaliveIntervalMs) {
        eventSourceInitDict['readTimeoutMillis'] = this._keepaliveIntervalMs + 5000;
      } else {
        // When no keepalive timeout is given, then we set the timeout to infinite to be sure, that the connection does not get closed.
        eventSourceInitDict['readTimeoutMillis'] = 0;
      }

      // The EventSource object holds the connection to the server.
      // For nodejs we use the implementation from: https://github.com/launchdarkly/js-eventsource
      let es;
      try {
        es = new EventSource(url, eventSourceInitDict)
      } catch(err) {
        callback(err);
        return;
      }


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
          // The stream has been permanently closed, either due to a non-retryable error or because close() was called.
          debug('onclosed()');

          if (this.listeners('closed').length > 0) {
            this.emit('closed');
          }
        };

        // @ts-ignore
        this._es.onend = () => {
          // The server ended the stream.
          debug('onend()');
          this._isEndByServer = true;

          if (this.listeners('end').length > 0) {
            this.emit('end');
          }
        };

        // @ts-ignore
        this._es.onretrying = (e) => {
          // After an error, this indicates that EventSource will try to reconnect after some delay. The event object's delayMillis property indicates the delay in milliseconds
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

          try {
            let payload = CtrlxDatalayer._parseData(e.data);
            if (!this.emit('update', payload, e.lastEventId)) {
              // Listener seems not yet to be attached. Retry on next tick.
              setTimeout(()=>this.emit('update', payload, e.lastEventId), 0);
            }
          } catch (err) {
            this.emit('error', new Error(`Error parsing update event: ${err.message}`));
          }

        });

        this._es.addEventListener('keepalive', (e) => {
          if (debugUpdate.enabled) {
            debugUpdate(`keepalive(${e.data})`);
          }

          try {
            let payload = CtrlxDatalayer._parseData(e.data);
            if (!this.emit('keepalive', payload, e.lastEventId)) {
              // Listener seems not yet to be attached. Retry on next tick.
              setTimeout(()=>this.emit('keepalive', payload, e.lastEventId), 0);
            }
          } catch (err) {
            this.emit('error', new Error(`Error parsing keepalive event: ${err.message}`));
          }
        });

        callback(null, this);
      };


    });
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
      // this._es.removeEventListener('keepalive');
      // @ts-ignore
      this._es.onopen = undefined;
      // @ts-ignore
      this._es.onclose = undefined;
      // @ts-ignore
      this._es.onend = undefined;
      // @ts-ignore
      this._es.onretrying = undefined;
      // @ts-ignore
      this._es.onerror = (e) => {
        // ignore any pending errors in the pipeline, which might get emitted and result in an uncaught exception
        debug(`onerror(${e.type})`);
      };
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
