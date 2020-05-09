
# Development Documentation

This file contains some documentation about development topics of this project.
Content is only relevant for developers which want to extend or debug this software.

## Overview

The following diagram shows a basic overview of the architecture of the project.

![Overview](https://www.plantuml.com/plantuml/svg/0/TLDDRwCm4BtpAqQSqW-gxXwh2ZLBM6qERIGIgNjrO49GOCpQGx9HbV--na1Yskm1sJEUUNxlcNdHB1GtLGcBFQfzWGTFxmggXH8LfBAg9I7naeybWgdwxdcrI7SYHqXPbN_Xm_C0qb9e3L6RYAH2a_am7q2mP5LG3YntI3PpTowQRALc4XNUGwDHTRlQu1oaocwwubBcSvfSWaN3GwHGP3F1eXH7L9DQyFRQmIkoo4pmtu84DwYGKjHkoK4LZ6FqUsXnslEJvvqkBf3CC52O1Qaa8tOTM5i2qR2i11UIhZX4coA7vsTuQtkJU6PyjgaM2yBmRDzTRz_Wr2Wvc3PA3lvroRMK9MIuRl9HKTzrQdaXDHKObxOowozDukdCRjwJ-IgskzTuDPrDLzF-_6USn6zHlBJXZsJnlem7E4UcO_6V1ZMF17zHwZgJuRv8UrqzjSekdwJozfeiav0qf_hogqYAIgbnqZsUuNb-FBzzhDyGBPBOD_nQUc5eANL2VZ7NUcd60fNjSrdwttou3GAxddzgU6hV1SA-z8i7_kF3mwqFGH2wVHRl2HJcXMPKPY38sJjupjKMeaExVfK19Cd5vWXcmhdH3eZX-Oc8AzHxGShCgFy3 "Overview")

The config node `CtrlxConfig` represents a connection to a ctrlX CORE. It holds the hostname, as well as the password for the connection.
Each node, that is used in a flow is actually registering and unregistering at the config node and using functions that the config node provides, to request information from the device. The config node is responsible to manage the connection to the device and updates the status of all registered nodes.
For actual connection handling a class instance of `CtrlxCore` is used, which is not Node-RED specific, but a reusable npm module. The `CtrlxCore` class also manages the session handling (e.g. caches the authorization token).

## Roadmap

### v1.0.0 (MVP)

- [ ] Implement: Auto reconnect and more resilience for server errors
- [ ] Implement: Node for common https requests
- [x] Decision: How to name the datalayer path ("path" vs "url")
- [x] Decision: Use topic for the datalayer path?
- [ ] Decision: How to name the node for common http requests? http vs. webapi
- [x] Decision: How to name? AUTOMATION vs. CORE
- [ ] Implement: User Documentation in the nodes
- [ ] Implement: User Documentation in the readme
- [ ] Implement: Node-RED Tests
- [ ] Implement: More Mocca Tests
- [x] Implement: Allow configuration of nodes via `msg` object
- [ ] Implement: Proper error handling. Return Problem.json on server errors.
- [x] Implement: Add support for mustache in msg.path.
- [ ] Implement: Add proper timeout handling
- [ ] Implement: Add support for browsing
- [ ] Implement: Implement correct outputs
- [ ] Fix: [DEP0123] DeprecationWarning

### v1.1.0

- [ ] Refactor: Extract CtrlxCore class into own npm library
- [ ] Feature: Find the device via UPnP
- [ ] Feature: Interactive Data Layer Browser
- [ ] Feature: Allow custom certificate handling

### v1.2.0

- [] Feature: i18n

## Tipps & Tricks

### How to enable debug logs

The library contains some debug logs, which can be enabled by passing the environment variable `DEBUG=ctrlxcore`.

This can also be enabled in VSCode. Note, that you need to also add the `outputCapture` property. Example:

    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Programm starten",
            "program": "D:/programs/nodered/red.js",
            "env": {
              "DEBUG": "ctrlxcore",
              "DEBUG_COLORS": "true"
            },
            "outputCapture": "std"
        }

## License

BSD 3-Clause License

Copyright (c) 2020, Bosch Rexroth AG
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.