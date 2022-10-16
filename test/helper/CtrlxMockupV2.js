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
 * The mockup simulates the version 2.x of the Data Layer protocol at the api endpoint: /automation/api/v2/
 *
 * @class CtrlxMockupV2
 */
class CtrlxMockupV2 {

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

    this.app.get('/automation/api/v2/nodes/framework/bundles/com_boschrexroth_comm_datalayer/active', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.json({
        value: true,
        type: 'bool'
      });
    });
    this.app.get('/automation/api/v2/nodes/framework/metrics/system/cpu-utilisation-percent', authenticateJWT, (req, res) => {
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
    this.app.get('/automation/api/v2/nodes/framework/metrics/system', authenticateJWT, (req, res) => {
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
    this.app.put('/automation/api/v2/nodes/plc/app/Application/sym/PLC_PRG/i', authenticateJWT, (req, res) => {
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
    this.app.get('/automation/api/v2/nodes/plc/app/Application/sym/PLC_PRG/i', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.json({
        value: this.var_i,
        type: 'int16'
      });
    });

    this.var_i64 = BigInt(9223372036854775807n);
    this.app.put('/automation/api/v2/nodes/plc/app/Application/sym/PLC_PRG/i64', authenticateJWT, (req, res) => {
      if (req.body.type !== 'int64') {
        res.statusCode = 405;
        res.send();
        return;
      }
      this.var_i64 = req.body.value;
      res.statusCode = 200;
      res.send(`{"type": "int64", "value":${this.var_i64.toString()}}`);
    });
    this.app.get('/automation/api/v2/nodes/plc/app/Application/sym/PLC_PRG/i64', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.send(`{"type": "int64", "value":${this.var_i64.toString()}}`);
    });

    this.var_str = 'vier';
    this.app.put('/automation/api/v2/nodes/plc/app/Application/sym/PLC_PRG/str', authenticateJWT, (req, res) => {
      if (req.body.type !== 'string') {
        res.statusCode = 405;
        res.send();
        return;
      }
      this.var_str = req.body.value;
      res.statusCode = 200;
      res.json({
        value: this.var_str,
        type: 'string'
      });
    });
    this.app.get('/automation/api/v2/nodes/plc/app/Application/sym/PLC_PRG/str', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.json({
        value: this.var_str,
        type: 'string'
      });
    });

    this.app.get('/automation/api/v2/nodes/nonexistent/path', authenticateJWT, (req, res) => {
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

    this.app.put('/automation/api/v2/nodes/diagnosis/confirm/error', authenticateJWT, (req, res) => {
      if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.statusCode = 200;
        res.send();
      }
      res.statusCode = 400;
      res.send();
      return;
    });


    //
    // Builtin Data Mockups - Create/Delete
    //
    this.app.post('/automation/api/v2/nodes/motion/axs', authenticateJWT, (req, res) => {
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
    this.app.delete('/automation/api/v2/nodes/motion/axs/nostromo', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.send();
    });
    this.app.post('/automation/api/v2/nodes/motion/axs/no/content', authenticateJWT, (req, res) => {
      res.statusCode = 200;
      res.send();
    });
    this.app.post('/automation/api/v2/nodes/motion/axs/axisx/cmd/reset', authenticateJWT, (req, res) => {
      if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.statusCode = 200;
        res.send();
      }
      res.statusCode = 400;
      res.send();
      return;
    });


    //
    // Builtin Data Mockups - Read with parameter
    //
    this.app.get('/automation/api/v2/nodes/test/add', authenticateJWT, (req, res) => {
      if (typeof req.query.data === 'undefined') {
        res.statusCode = 405;
        res.send();
        return;
      }

      let data = JSON.parse(req.query.data);
      if (typeof data.value === 'undefined' || typeof data.value.arg1 === 'undefined' || typeof data.value.arg2 === 'undefined') {
        res.statusCode = 405;
        res.send();
        return;
      }

      let x1 = data.value.arg1;
      let x2 = data.value.arg2;

      res.statusCode = 200;
      res.json({
        value: x1 + x2,
        type: 'uint32'
      });
    });



    //
    // Builtin Data Mockups - Events/Subscription
    //
    this.app.get('/automation/api/v2/events', authenticateJWT, (req, res) => {

      // Handle optional parameter publishIntervalMs
      let publishIntervalMs = 1000;
      if (typeof req.query.publishIntervalMs !== 'undefined') {
        // @ts-ignore
        publishIntervalMs = req.query.publishIntervalMs;
      }

      // Nodes are given as comma separate array
      if (typeof req.query.nodes === 'undefined') {
        res.statusCode = 400;
        res.send();
        return;
      }

      // URL characters (e.g. '^') must be encoded
      if (req.url.includes("^")) {
        res.statusCode = 400;
        res.send();
        return;
      }

      // @ts-ignore
      let nodes = req.query.nodes.split(',');

      // Create a mockup stream which returns the requested nodes
      const SseStream = require('ssestream').default;
      const sseStream = new SseStream(req);
      sseStream.pipe(res)

      let id = 0;
      let pushers = new Array();

      nodes.forEach(element => {

        let pusher = setInterval(() => {

          let data = {
            node: element,
            schema: undefined,
            timestamp: Date.now() * 1e4 + 116444736e9  // expected format is FILETIME (100-nanosecond intervals since January 1, 1601 UTC)
          }

          switch (element) {
            case 'framework/metrics/system/cpu-utilisation-percent':
              data.value = Math.random() * 100;
              data.type = 'double';
              break;
            case 'framework/bundles/com_boschrexroth_comm_datalayer/active':
              data.value = (Math.random() > 0.5) ? true : false;
              data.type = 'bool';
              break;
            case 'plc/app/Application/sym/PLC_PRG/i':
              data.value = Math.round(Math.random() * 4096);
              data.type = 'int16';
              break;
            case 'motion/axs/Axis_X/state/values/actual/acc/cm-per-s^2':
                data.value = 42;
                data.type = 'double';
                break;
            case 'test/broken/connection/i':
              data.value = id;
              data.type = 'int16';
              // This is a special node. If included it will kill the connection after a second to
              // mock a connection interruption.
              setTimeout(() => {
                sseStream.unpipe(res)
                res.connection.destroy();
              }, 1000);
              break;

            default:
              data.value = 'error: unknown value';
              data.type = 'string';
          }

          sseStream.write({
            id: id++,
            event: 'update',
            data: data
          });

        }, publishIntervalMs);

        pushers.push(pusher);
      });


      res.on('close', () => {
        pushers.forEach(pusher => {
          clearInterval(pusher)
        });
        sseStream.unpipe(res)
      });


    })


  }







  /**
   * Start the mockup server.
   *
   * @param {string} hostname - The hostname for the server to listen on.
   * @param {number} port - The port for the server to liston on.
   * @param {object} callback - Will be called when server is listening.
   * @memberof CtrlxMockupV2
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
   * @memberof CtrlxMockupV2
   */
  stopServer(callback) {
    this.httpsServer.close(() => {
      if (callback) {
        callback();
      }
    });
  }

}

module.exports = CtrlxMockupV2;
