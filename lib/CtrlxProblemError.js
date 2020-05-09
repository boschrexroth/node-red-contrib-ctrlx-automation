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

const STATUS_CODES = require('http').STATUS_CODES;



/**
 * This is the error class specialization for errors returned by ctrlX devices.
 * It is based on the RFC 7807 'Problem Details for HTTP APIs'.
 * See: https://tools.ietf.org/html/rfc7807
 *
 * For detailed description see json schema: https://github.com/boschrexroth/json-schema/TODO
 *
 * @class CtrlxProblemError
 * @extends {Error}
 */
class CtrlxProblemError extends Error {

  constructor(title, type) {
    super(title);

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CtrlxProblemError)
    }

    this.name = 'CtrlxProblemError';
    this._title = title;
    this._type = type;
    this._status = undefined;
    this._detail = undefined;
    this._instance = undefined;
    this._mainDiagnosisCode = undefined;
    this._detailedDiagnosisCode = undefined;
    this._dynamicDescription  = undefined;
    this._severity = undefined;
  }


  /**
   * A static factory method to construct a CtrlxProblemError from a http statuscode.
   *
   * @static
   * @param {number} status - The http status code.
   * @returns {CtrlxProblemError}
   * @memberof CtrlxProblemError
   */
  static fromHttpStatuscode(status) {

    let ctrlXProblemError = new CtrlxProblemError(`[${status}] ${STATUS_CODES[status]}`, 'about:blank');
    ctrlXProblemError._status = status;

    return ctrlXProblemError;
  }


  /**
   * A static factory method to construct a CtrlxProblemError from a http request response.
   *
   * @static
   * @param {object} response - The response object as returned by the http request.
   * @param {string} data - The data returned as on the http request.
   * @returns {CtrlxProblemError}
   * @memberof CtrlxProblemError
   */
  static fromHttpResponse(response, data) {

    try {
      // Try to parse the server response and use the provided data to fill the
      // error class.
      let problem = JSON.parse(data);

      let ctrlXProblemError = new CtrlxProblemError(problem.title, problem.type);
      ctrlXProblemError._title = problem.title;
      ctrlXProblemError._type = problem.type;
      ctrlXProblemError._status = problem.status;
      ctrlXProblemError._detail = problem.detail;
      ctrlXProblemError._instance = problem.instance;
      ctrlXProblemError._mainDiagnosisCode = problem.mainDiagnosisCode;
      ctrlXProblemError._detailedDiagnosisCode = problem.detailedDiagnosisCode;
      ctrlXProblemError._dynamicDescription  = problem.dynamicDescription;
      ctrlXProblemError._severity = problem.severity;

      return ctrlXProblemError;

    } catch (err) {

      // We could not parse the problem returned in the body of the response. Let's use as much information, that
      // we have to generate an error object.
      let ctrlXProblemError = new CtrlxProblemError(`[${response.statusCode}] ${response.statusMessage}`, 'about:blank');
      ctrlXProblemError._status = response.statusCode;

      return ctrlXProblemError;
    }
  }


  /**
   * Returns an extended string representation of the error.
   *
   * @returns {string}
   * @memberof CtrlxProblemError
   */
  toStringExtended() {
    let txt = `${this.name}: ${this.title}`;

    if (this.type !== 'about:blank' && this.type.length != 0) {
      txt += `\ntype: ${this.type}`;
    }

    if (this.detail && this.detail.length != 0) {
      txt += `\ndetail: ${this.detail}`;
    }

    if (this.dynamicDescription && this.dynamicDescription.length != 0) {
      txt += `\ndynamicDescription: ${this.detail}`;
    }

    if (this.instance && this.instance.length != 0) {
      txt += `\ninstance: ${this.instance}`;
    }

    if (this.severity && this.severity.length != 0) {
      txt += `\nseverity: ${this.severity}`;
    }

    if (this.mainDiagnosisCode && this.mainDiagnosisCode.length != 0) {
      txt += `\nmainDiagnosisCode: ${this.mainDiagnosisCode}`;
    }

    if (this.detailedDiagnosisCode && this.detailedDiagnosisCode.length != 0) {
      txt += `\ndetailedDiagnosisCode: ${this.detailedDiagnosisCode}`;
    }

    if (this.status) {
      txt += `\nstatus: ${STATUS_CODES[this.status]}`;
    }

    return txt;
  }


  /**
   * A URI reference [RFC3986] that identifies the problem type. This specification encourages that, when dereferenced,
   * it provide human-readable documentation for the problem type (e.g., using HTML [W3C.REC-html5-20141028]).
   * When this member is not present, its value is assumed to be "about:blank".
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example 'https://example.com/probs/out-of-credit'
   * @default 'about:blank'
   */
  get type() {
    return this._type;
  }


  /**
   * A short, human-readable summary of the problem type.
   * It SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization
   * (e.g., using proactive content negotiation; see [RFC7231], Section 3.4).
   * This is the same as the exception message.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example 'You do not have enough credit.'
   */
  get title() {
    return this._title;
  }


  /**
   * The HTTP status code ([RFC7231], Section 6) generated by the origin server for this occurrence of the problem.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {number}
   * @example 403
   */
  get status() {
    return this._status;
  }


  /**
   * A human-readable explanation specific to this occurrence of the problem.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example 'Your current balance is 30, but that costs 50.'
   */
  get detail() {
    return this._detail;
  }


  /**
   * A URI reference that identifies the specific occurrence of the problem.
   * It may or may not yield further information if dereferenced.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example '/account/12345/msgs/abc'
   */
  get instance() {
    return this._instance;
  }


  /**
   * The main diagnosis code is issued by the system that caused the problem.
   * This code can be used to track down the root cause and source of the error.
   * It can be used to search in the documentation for a solution.
   * It SHOULD NOT change from occurrence to occurrence of the same problem.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example 'F360001'
   */
  get mainDiagnosisCode() {
    return this._mainDiagnosisCode;
  }


  /**
   * The detailed diagnosis code issued by the system that caused the problem.
   * This code can be used to track down the detailed cause and source of the error.
   * It can be used to search in the documentation for a solution.
   * The detailed diagnosis code gives additional information about the cause of the error.
   * It SHOULD NOT change from occurrence to occurrence of the same problem.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example '00666001'
   */
  get detailedDiagnosisCode() {
    return this._detailedDiagnosisCode;
  }


  /**
   * A dynamic description gives detailed information about the occurrence of a problem.
   * It can change between different occurrences of the same error.
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example 'value = -4.5'
   */
  get dynamicDescription() {
    return this._dynamicDescription;
  }


  /**
   * Severity of a problem as defined RFC5424 of the Syslog standard, see https://tools.ietf.org/html/rfc5424'
   * Possible values are:
   * - Emergency
   * - Alert
   * - Critical
   * - Error
   * - Warning
   * - Notice
   * - Informational
   * - Debug
   *
   * @readonly
   * @memberof CtrlxProblemError
   * @returns {string}
   * @example 'Error'
   */
  get severity() {
    return this._severity;
  }

}

module.exports = CtrlxProblemError;
