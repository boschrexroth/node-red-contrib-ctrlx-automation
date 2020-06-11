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

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const jwt = require('jwt-simple');




/**
 * This is a simple mockup of a ctrlX device that can be used for unit testing.
 *
 * @class CtrlxMockup
 */
class CtrlxMockup {

  constructor() {
    this.httpServer = undefined;

    // create new express app and save it as "app"
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());

    //
    // Authentication
    //
    this.sessionEstablished = false;
    this.app.post('/identity-manager/api/v1/auth/token', (req, res) => {
      if ( !req.body.name || req.body.name !== 'boschrexroth'
        || !req.body.password || req.body.password !== 'boschrexroth' ) {
        res.statusCode = 401;
        res.send();
        return
      }
      let token = jwt.encode({
        iat: Date.now().valueOf() / 1000,        // issued at (seconds since 1970)
        exp: Date.now().valueOf() / 1000 + 120,  // expiration time (seconds since 1970)
      }, 'secret');
      let result = {
        token_type: 'Bearer',
        access_token: token,
      };
      this.sessionEstablished = true;
      res.statusCode = 201;
      res.json(result);
    });

    this.app.delete('/identity-manager/api/v1/auth/token', (req, res) => {
      this.sessionEstablished = false;
      res.statusCode = 204;
      res.send();
    });

    const authenticateJWT = (req, res, next) => {

      if (!this.sessionEstablished) {
        res.sendStatus(401);
        return;
      }

      const authHeader = req.headers.authorization;
      if (authHeader) {
          const token = authHeader.split(' ')[1];

          try {
            let decoded = jwt.decode(token, 'secret');
            let dateNow = Date.now().valueOf() / 1000;
            if (dateNow < decoded.iat) {
              return res.sendStatus(401);
            }
            if (dateNow > decoded.exp) {
              return res.sendStatus(401);
            }
            next();
          } catch (error) {
            return res.sendStatus(403);
          }
      } else {
          res.sendStatus(401);
      }
    };



    //
    // Builtin Data Mockups
    //

    this.app.get('/automation/api/v1/framework/bundles/com_boschrexroth_comm_datalayer/active', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.json({
        value: true,
        type: 'bool'
      });
    });
    this.app.get('/automation/api/v1/framework/metrics/system/cpu-utilisation-percent', authenticateJWT, (req, res) => {
      switch (req.query.type) {
        case undefined:
          res.statusCode = 200;
          res.json({
            value: 17.5,
            type: 'double'
          });
          break;
        case 'data':
          res.statusCode = 200;
          res.json({
            value: 17.5,
            type: 'double'
          });
          break;
        case 'metadata':
          res.statusCode = 200;
          res.json({
            nodeClass: "Resource",
            operations: {
              read: true,
              write: false,
              create: false,
              delete: false,
            },
            description: "",
            descriptionUrl: "'descriptionUrl'",
            displayName: "'displayName'",
            displayFormat: "Auto",
            unit: "'unit'",
            references: [
              { type: "createType", targetAddress: "" },
              { type: "readType", targetAddress: "" },
              { type: "writeType", targetAddress: "" },
            ],
          });
          break;
        case 'references':
          res.statusCode = 200;
          res.json({
            "type":"arstring", "value":[""]   // TODO: is this format correct?
          });
          break;
        default:
          res.statusCode = 405;
          res.send();
          break;
      }
    });
    this.app.get('/automation/api/v1/framework/metrics/system', authenticateJWT, (req, res) => {
      if (req.query.type === 'browse') {
        res.statusCode = 200;
        res.json({
          "type":"arstring", "value":["cpu-utilisation-percent","memavailable-mb","membuffers-mb","memcache-mb","memfree-mb","memtotal-mb","memused-mb","memused-percent"]
        });
        return;
      }
      res.statusCode = 405;
      res.send();
      return;
    });

    this.var_i = 0;
    this.app.put('/automation/api/v1/plc/app/Application/sym/PLC_PRG/i', authenticateJWT, (req, res) => {
      if (req.body.type !== 'int16') {
        res.statusCode = 405;
        res.send();
        return;
      }
      this.var_i = req.body.value;
      res.statusCode = 200;
      res.json({
        value: this.var_i,
        type: 'int16'
      });
    });
    this.app.get('/automation/api/v1/plc/app/Application/sym/PLC_PRG/i', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.json({
        value: this.var_i,
        type: 'int16'
      });
    });

    this.app.get('/automation/api/v1/nonexistent/path', authenticateJWT, (req, res) => {
      res.statusCode = 404;
      res.json({
        title: 'Error on Read',
        type: 'about:blank',
        status: 404,
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/account/12345/msgs/abc',
        mainDiagnosisCode: 'F0360001',
        detailedDiagnosisCode: '00666001',
        dynamicDescription : 'This could be a dynamic description',
        severity: 'ERROR'
      });
    });

    //
    // Builtin Data Mockups
    //
    this.app.post('/automation/api/v1/motion/axs', authenticateJWT, (req, res) => {
      if (req.body.type !== 'string') {
        res.statusCode = 405;
        res.send();
        return;
      }
      res.statusCode = 200;
      res.json({
        value: 1048576,
        type: 'uint32'
      });
    });
    this.app.delete('/automation/api/v1/motion/axs/nostromo', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.send();
    });
    this.app.post('/automation/api/v1/motion/axs/no/content', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.send();
    });
  }





  /**
   * Start the mockup server.
   *
   * @param {object} callback - Will be called when server is listening.
   * @memberof CtrlxMockup
   */
  startServer(callback) {
    const options = {
      key: fs.readFileSync('./test/certs/key.pem'),
      cert: fs.readFileSync('./test/certs/cert.pem')
    };

    this.httpsServer = https.createServer(options, this.app);
    this.httpsServer.listen(443, 'localhost', () => {
      callback();
    });
  }


  /**
   * Stop the mockup server.
   *
   * @param {object} callback - Will be called, when server is shutdown.
   * @memberof CtrlxMockup
   */
  stopServer(callback) {
    this.httpsServer.close(() => {
      if (callback) {
        callback();
      }
    });
  }

}

module.exports = CtrlxMockup;
