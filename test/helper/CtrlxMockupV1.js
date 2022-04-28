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

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const jwt = require('jwt-simple');



/**
 * This is a simple mockup of a ctrlX device that can be used for unit testing.
 * The mockup simulates the version 1.x of the Data Layer protocol at the api endpoint: /automation/api/v1/
 *
 * @class CtrlxMockupV1
 */
class CtrlxMockupV1 {

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
    this.app.post('/identity-manager/api/v2/auth/token', (req, res) => {
      if (!req.body.name || req.body.name !== 'boschrexroth'
        || !req.body.password || req.body.password !== 'boschrexroth') {
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

    this.app.delete('/identity-manager/api/v2/auth/token', (req, res) => {
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
    // Builtin Data Mockups - Basics
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
        // fallthrough intended
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
            "type": "arstring", "value": [""]
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
          "type": "arstring", "value": ["cpu-utilisation-percent", "memavailable-mb", "membuffers-mb", "memcache-mb", "memfree-mb", "memtotal-mb", "memused-mb", "memused-percent"]
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
        dynamicDescription: 'This could be a dynamic description',
        severity: 'ERROR'
      });
    });


    //
    // Builtin Data Mockups - Create/Delete
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


    //
    // Builtin Data Mockups - Read with parameter
    //
    this.app.post('/automation/api/v1/test/add', authenticateJWT, (req, res) => {
      let x1 = req.body.arg1;
      let x2 = req.body.arg2;

      if (typeof x1 === 'undefined' || typeof x2 === 'undefined') {
        res.statusCode = 405;
        res.send();
        return;
      }
      res.statusCode = 200;
      res.json({
        value: x1 + x2,
        type: 'uint32'
      });
    });

  }


  /**
   * Start the mockup server.
   *
   * @param {string} hostname - The hostname for the server to listen on.
   * @param {number} port - The port for the server to liston on.
   * @param {object} callback - Will be called when server is listening.
   * @memberof CtrlxMockupV1
   */
  startServer(hostname = 'localhost', port = 443, callback) {
    const options = {
      key: fs.readFileSync('./test/certs/key.pem'),
      cert: fs.readFileSync('./test/certs/cert.pem')
    };

    this.httpsServer = https.createServer(options, this.app);
    this.httpsServer.listen(port, hostname, () => {
      callback();
    });
  }


  /**
   * Stop the mockup server.
   *
   * @param {object} callback - Will be called, when server is shutdown.
   * @memberof CtrlxMockupV1
   */
  stopServer(callback) {
    this.httpsServer.close(() => {
      if (callback) {
        callback();
      }
    });
  }

}

module.exports = CtrlxMockupV1;
