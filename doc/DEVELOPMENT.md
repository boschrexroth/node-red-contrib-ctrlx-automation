
# Development Documentation

This file contains some documentation about development topics of this project.
Content is only relevant for developers which want to extend or debug this software.

## Overview

The following diagram shows a basic overview of the architecture of the project.

![OverviewSimple](https://www.plantuml.com/plantuml/svg/VLJ1Rfj04Btp5IDERXAYjiSeGd40gPQQMiAMtEiQ9XWPTkZkODUA_EzT5Z3OGJqWPj_CldtpXkL5ir1SbmKi3wWEEHuTlSzb9PGe8Q6o8ecILtmg44pLTyUfHB8N6KB2glWB7uu3a1H2QmWQ82251lam3u2tOfNB39ZsA2roVocQxKYp52K-GArHjL5bU8waqYzjSK7PGiw6nRBcVfKA5eKueOfHfBDAy6ugyOOi6c2oOADoHfjvW0QypGSAnNyBGYomAxXDlIewwY5rTfppu9oa53s5gPUGD0PjFMkb9sgcKd1ESi9L-PvdyFmClvgzSHIQsLYeuGBVlrX-trdUkti5zaPVWRtdBRWbAY35RPrT5NMxpeqkb7K9njaTfTsXSJGFRR295-l8He71kZ2CVaPT-1Qjv-5yFRUBrtYvMKKzwwZRS1ZXdnerN_NzgU6nGIaUygHhhrDOsjTDnxoRwiu091Uo6huoaa51Pexj38tEompTPcQ_8LZ6aMlqDV9ytqfg6_d1NEcLkL6exBwnIlUR2tUUPz-N-m1FpNZ0xqe_UU1-VNoySy7p_F4-o_S42hDSCofpb-Ge7l6DZhOKBTlqKOPG4kVl9p0_1wxrYCJel14oRjHvGPcQlyG_ "Overview")

The config node `CtrlxConfig` represents a connection to a ctrlX CORE. It holds the hostname, as well as the password for the connection.
Each node, that is used in a flow is actually registering and unregistering at the config node and using functions that the config node provides, to request information from the device. The config node is responsible to manage the connection to the device and updates the status of all registered nodes.
For actual connection handling a class instance of `CtrlxCore` is used, which is not Node-RED specific, but a reusable npm module. The `CtrlxCore` class also manages the session handling (e.g. caches the authorization token).

![Overview](https://www.plantuml.com/plantuml/svg/fLLDRzf04BtxLumuqJIEsXuZP8M0fIAL8XaaSbtR4x1OxxgxQz8qod_lU6tmuXYAr0DY_URhpSpp-a4RfaoPSrZiKUqpVF7qBXC5Koo7HEQ552ZCqhno1FBwvda5ItPiWv0OnN_3c-S199nf3PCAc4Y5XBpH3y1V6fM93HYvGs6HpqUduLPg8rYEjr1gLFMfe3mlKgMVQcSkDpCnR1yMfJayfSmmpbvHHSZIOS7CjiymHyCgeDTXhJA3rd8B5TYrJnIoYmvJvDWuT4sFIhxeVjEoZ7MYihYswihytXdYjEDRc4oAurJh6IOqGzVip9ELPYjLzeTLU3NKfWo5oWB5C66SnxJ51aku9AeDZ_TsmKAcw2jC_KGAscFisutxb5tcDdNFyiLpje7H27vMiL4u9GbPgCe5GT3sq2ZZGFe4FEZX13n8emPZAJca69UR4wScwhsNbpkjgpYwFQMupnBiAqQ0AFCO5HHbp3EzdGb3RnBZStsWWkG0fCMjJ9lSKJYUsiCwcgr2UveGrXoduO-mESx3rNWwNetjmsEqM2_3IuA9y5U9sfoqTtLV3SFS_dM6RxPdUfTY9ehslPHYuihfegnZl9hdoUxqwLjn9KsN5p4xodnGoVe99eie712VYauGM0erzU_657f96qLbuzpf3RuEuCRtxV_nPeFxIi4GUFsh6NovkxiPWEy7RfXDTmyADvac-T2bA9npcyufR3FKoVehKJuXJVRy2dJ9crAtEOXaXuRRfNV-4heGHjLmJzyAAaONPmwZVnBkMUrvoXzS_tUED8CgzaAlzv3OJy27LRRwTKYSuzbFvhh6pfKbXHMfmwmlIrUQvtgiX-8ze4Zf0_yN "Overview")

To handle subsciptions an additional config node `CtrlXConfigSubscription`is necessary. It groups together multiple `CtrlxDatalayerSubscribe` nodes and registers itself also on a `CtrlxConfig` node. Dispatch of all incoming data updates via event stream (Server Sent Events) is also done in this node.

## Roadmap

### v1.2.0 (MVP)

- [x] Implement: Authentication for seesion with automatic handling of certificate expiration
- [x] Implement: Node to allow requests to datalayer
- [x] Implement: Auto reconnect and more resilience for server errors
- [x] Implement: User Documentation in the nodes
- [x] Implement: User Documentation in the readme
- [x] Implement: Solid testing framework for lib an node
- [x] Implement: A decent amount of tests for good coverage
- [x] Implement: Allow configuration of nodes via `msg` object
- [x] Implement: Proper error handling. Return Problem.json on server errors
- [x] Implement: Add support for mustache in msg.path
- [x] Implement: Add proper timeout handling
- [x] Implement: Add support for browsing
- [x] Implement: Implement correct outputs
- [x] Implement: Create/Delete on datalayer
- [x] Implement: Make sure, that async/await is working
- [x] Fix: [DEP0123] DeprecationWarning
- [x] Implement: Interactive Data Layer Browser

### v1.8.0

- [x] Feature: Basic subscription support
- [x] Implement: Unit tests for node-red
- [x] Implement: Update documentation
- [x] Feature: Support custom port after hostname. E.g. 'localhost:8443'.
- [x] Feature: Different output types (value only, value + type)

### vX.X.0

- [ ] Feature: Support for read with arguments and methods
- [ ] Feature: Allow custom certificate handling
- [ ] Feature: Support http proxy configuration
- [ ] Feature: Add keep-alive mechanism to subscription to better detect network communication problems
- [ ] Feature: Implement dynamic subscriptions

### vX.X.0

- [ ] Refactor: Extract CtrlxCore class into own npm library
- [ ] Feature: Support typescript bindings

### vX.X.0

- [ ] Feature: i18n
- [ ] Feature: Find the device via UPnP

## Test

To run the unit tests call `npm test`. Extended logging can be enabled via `npm run test_with_debug_log`.
For calculation of coverage call with `npm run test_with_coverage`. Use `npm run test_with_coverage_html` to
generate a pretty html report.
By default, the tests are running against a mockup of the device which runs as server on localhost.
But it is possible to override the settings via enviroment variables to also run the tests agains a real hardware.

Environment variables:

- `TEST_HOSTNAME` The hostname to run the tests against.
- `TEST_USERNAME` The username to use for the tests.
- `TEST_PASSWORD` The password to use for the tests.

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
