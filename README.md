# Node-RED nodes for ctrlX AUTOMATION

This package ***node-red-contrib-ctrlx-automation*** contains nodes to easily connect to [ctrlX AUTOMATION](https://www.ctrlx-automation.com/) devices from [Bosch Rexroth](https://www.boschrexroth.com).

Using the nodes you can read from and write to the ctrlX Data Layer.  
The nodes can run in a Node-RED app environment on a ctrlX CORE device as well as on a third-party device which runs Node-RED.

![nodes.png](./doc/images/nodes.png)

***Important:*** Please upgrade the AutomationCore System App to at least version 1.8.0 (XCR-V-0108, part of ReleaseMilestone 21.03) or newer, because the nodes are now using the new API which introduces subscription support!

---

## Installation

Install using the managed palette from inside Node-RED.

### In Node-RED (preferred)

* Via **Manage Palette** -> **Search** for `node-red-contrib-ctrlx-automation`

### In a shell

* go to the Node-RED user data directory, e.g.: `~/.node-red`
* run `npm install node-red-contrib-ctrlx-automation`

## Usage

There are two new nodes which appear in the category 'ctrlX AUTOMATION' in your Node-RED palette.

![nodes.png](./doc/images/nodes.png)

In addition to that a configuration node will be added to the project as soon as the nodes are used in a flow. The configuration node contains all settings for a connection to a device and is used by other nodes which are embedded in the flow and share the same session. The three nodes are described below in more detail.

### Configuration Node *ctrlx-config*

#### Configuration dialog

<img src="./doc/images/node-settings-config.png" alt="Configuration node settings" width="400px"/>

#### Configuration properties

##### Address

This configuration attribute is set to the address of the ctrlX AUTOMATION Node-RED device. It can be an IP address or a hostname.  
In case that the node runs directly on a ctrlX CORE device, also *localhost* can be used.

##### Username / Password

You need a configured user and password for your ctrlX CORE connection.  
Basically, you can use every <strong>user/password</strong> combination which is present in the ctrlX CORE.

<details>
  <summary><strong>Hint:</strong> Use dedicated <strong>credentials</strong> for Node-RED logins</summary>
  It is recommended to configure a dedicated user for your node-RED connection. Only the permissions that are really needed should be assigned.
  <p>This configuration can be done after logging into your ctrlX CORE:
  Go to <strong>-> Settings -> Users & Permissions</strong>.
</details>

##### Name

This is an arbitrary name which is displayed in the Node-RED editor.

##### Debug mode

If checked, the node emits debug information on the ctrlX CORE debug message logger.

The logger can be reached in the ctrlX CORE web interface via **Diagnostics** -> **Logbook**.  
The visibility of the messages has to be activated via the dialogs **setup/cog** icon:

<details>
  <summary>Expand for <strong>screenshot</strong></summary>

<img src="./doc/images/node-red-ui-logbook-settings.png" alt="ctrlX CORE logbook settings" width="200px"/>

</details>

Additionally ***snap.rexroth-node-red.node-red.service*** has to be ckecked in the **Filter** -> **Units** dialog.

<details>
  <summary>Expand for <strong>screenshot</strong></summary>

<img src="./doc/images/node-red-ui-logbook-filter-settings.png" alt="ctrlX CORE logbook filter settings" width="500px"/>

</details>

An example output is shown in the following figure:

<img src="./doc/images/node-red-ui-logbook-output.png" alt="ctrlX CORE logbook output" width="800px"/>

<br>
<br>

### Data Layer Request

The node offers read and write access to/from the ctrlX Data Layer, browsing and creating/deleting objects in the ctrlX Data Layer. It accesses the so called *data nodes* in the Data Layer tree structure which are addressed via a *path* addressing scheme.  
Only "end nodes" can be accessed and no tree structures (i.e. a node with its whole sub-nodes as a compact data object).

A node basically consists of the following parts:

* Address: Path used to address this node
* Data: Node value
* Metadata: Additional node information, e.g. data type, unit, displayname.

Access permissions are taken into account in respect to the underlying configuration node settings.

#### Configuration dialog

<img src="./doc/images/node-settings-dl-request.png" alt="Data Layer Request node settings" width="400px"/>
<br><br>

#### Configuration properties

##### Device

The **ctrlX CORE device** which was creating with its *Configuration Node* (see above) has to be selected there.

##### Method

This property sets the **method to be called**. If it is not set, it has to be given via the input `msg.method` attribute.  
Possible values are:

* `READ`: ***Read data*** of the data node represented by the *Path* property.
* `WRITE`: ***Write data*** of the data node represented by the *Path* property.
* `CREATE`: ***Generate*** a resource/subnode at the tree given by the *Path* property.
* `DELETE`: ***Remove*** a resource/subnode at the tree given by the *Path* property.
* `BROWSE`: ***Browsing***, i.e. read the tree subnodes of the given *Path* property.
* `READ_WITH_ARG`: ***Read data*** of the data node represented by the *Path* property. The difference to `READ` is that additional data is given with the read access.
* `METADATA`: ***Read metadata*** of the data node represented by the *Path* property.

##### Path

This property sets the **path to the Data Layer node** which shall be accessed. If it is not set, it has to be given via the input `msg.path` attribute.  
Examples for a path are `framework/state` or `diagnosis/clear/error`

The **magnifier symbol** opens a browsing dialog where all accessible Data Layer nodes are displayed.

##### Name

This is an arbitrary name which is displayed in the Node-RED editor.

#### Inputs of the *Data Layer Request* node

The inputs of the node are given via the attributes `msg.path`, `msg.method`, `msg.payload` and `msg.requestTimeout`.

Some of the attributes are identical to configuration properties of the node. I.e., if the related configuration properties are set via the configuration dialog and via attribute values given in the input `msg`, they should not be different. Otherwise a warning message is emitted.  
In the case that the related configuration properties are left blank within the configuration dialog, the attribute values must be given in the input `msg` part.

##### Input `msg.path`

Same as configuration attribute ***Path***.

##### Input `msg.method`

Same as configuration attribute ***Method*** except set by `msg.method`.

##### Input `msg.payload`

Data to be sent in case of ***WRITE***, ***READ_WITH_ARG*** or ***CREATE*** method.

##### Input `msg.requestTimeout`

If set to a positive number of milliseconds, will override the globally set httpRequestTimeout parameter.
Default: 120000 (2 minutes)

##### Example input `msg`

An example input `msg` containing the input values described above with `READ` access and no `msg.payload` data could be as follows:

<img src="./doc/images/node-inputs-example.png" alt="Input message example" width="400px"/>
<br><br>

<details>
  <summary>Expand for <strong>input message</strong> JSON data (debug window output)</summary>

  ```JSON
  {
    "method":"READ",
    "path":"framework/metrics/system/cpu-utilisation-percent",
    "requestTimeout":100,
    "_msgid":"b424040c.6715c8"
  }
  ```

</details>

#### Outputs of the *Data Layer Request* node

##### Output `msg.payload`

The `msg.payload` contains the data which is given back by the Data Layer Request operation.

Rules exist how the Data Layer variant types are converted into the Node-RED JSON data types.  
See the [Data Layer Base documentation](#References) for further details.

Examples:

* Data Layer variant type **FLOAT64** is converted to JSON data type **double**
* Data Layer variant type **ARRAY_OF_STRING** is converted to JSON array **arstring**

##### Output `msg.topic`

If the `msg.topic` property is not already set or is an empty string within the input `msg` object, then it will be set to the effective `path` of the request (see second example output below).

##### Example output `msg`

Example output `msg` when using ***Data Layer Request node properties***:

  ```JSON
  {
    "_msgid":"7d10a368.35a33c",
    "payload":{"type":"double","value":3.1}
  }
  ```

Example output `msg` when using input `msg` attributes (with `msg.topic`):

  ```JSON
  {
    "method":"READ",
    "path":"framework/metrics/system/cpu-utilisation-percent",
    "requestTimeout":100,
    "topic":"framework/metrics/system/cpu-utilisation-percent",
    "_msgid":"d6a822de.b10f7",
    "payload":{"type":"double","value":3.1}
  }
  ```

#### Diagnosis of the *Data Layer Request* node

##### Node status output

The node status gives some diagnostic information. The following messages may occur:

* Not logged in
* Authenticated (occurs only at flow start)
* Authentication failed (occurs only at flow start)
* Requesting
* Request failed
* Request successful

<img src="./doc/images/node-status.png" alt="Node status example" width="500px"/>
<br><br>

##### Node-RED debug panel output

In case of an error, the node will **not** emit a `msg` but throws an error, that can be caught by the ***catch*** node.  
The errors and warnings are also visible in the Node-RED debug sidebar.

<img src="./doc/images/node-error-debug-sidebar.png" alt="Node error debug output example" width="250px"/>
<br><br>

The following **error** messages may occur:

* *Method property of node unknown or not implemented: <node.method>*: Occurs, if the method given by `msg.method` is invalid (e.g. set to "WRIT").
* *property path for node is not set*: Occurs, if no path given by `msg.path` and the *Path* property within the node configuration is empty.
* *property method for node is not set*: Occurs, if no method given by `msg.method` and the *Method* property within the node configuration is empty.
* *internal error: received invalid pending request!*: This is a node internal error and can't be resolved by the user.

The following **warnings** may occur:

* *msg.requestTimeout is given as NaN* and *msg.requestTimeout is given as negative value*: Wrong timeout value is set via `msg.requestTimeout`.
* *`msg.path` differs from configuration property Path of node* resp. *`msg.method` differs from configuration property Method of node*: Occurs, if input `msg` attributes and corresponding node configuration properties do not match (`msg.path` vs. *Path* or `msg.method` vs. *Method*).
* *CtrlxProblemError: DL_INVALID_ADDRESS*: Occurs, if the path given by `msg.path` or within the node configuration is not present (e.g. misspelled).

Further error messages which come directly from the Data Layer are also possible.  
As an example, if the `msg.path` does not point to an existent Data Layer node, an error "*CtrlxProblemError: DL_INVALID_ADDRESS*" is emitted.

### Data Layer Subscribe

This node allows to subscribe to value changes of an item in the ctrlX Data Layer. It is an input node, which does not need to be triggered, but automatically emits a new `msg`, when the value changes. This node is very efficient, because it does not poll but only publish server sent events. Monitoring of the value is done on server side.

### Examples

There are multiple example flows included which demonstrate how the node can be use.
They appear under the Examples section of the library import menu in Node-RED.

![datalayer_request_examples.png](./doc/images/datalayer_request_examples.png)

## Support

This repository is provided and maintained by [Bosch Rexroth](https://www.boschrexroth.com). Feel free to check out and be part of the [ctrlX AUTOMATION Community](https://ctrlx-automation.com/community). Get additional support, e.g. related to Bosch Rexroth Devices, Apps, SDKs and Services, or leave some ideas and feedback.

To report bugs, request changes and discuss new ideas you may also have a look at the issue tracker of this repository:
<https://github.com/boschrexroth/node-red-contrib-ctrlx-automation/issues>

## Important directions for use

### Areas of use and application

The content (e.g. source code and related documents) of this repository is intended to be used for configuration, parameterization, programming or diagnostics in combination with selected Bosch Rexroth ctrlX AUTOMATION devices.
Additionally, the specifications given in the "Areas of Use and Application" for ctrlX AUTOMATION devices used with the content of this repository do also apply.

### Unintended use

Any use of the source code and related documents of this repository in applications other than those specified above or under operating conditions other than those described in the documentation and the technical specifications is considered as "unintended". Furthermore, this software must not be used in any application areas not expressly approved by Bosch Rexroth.

## Changelog

- 2020-09-29: 1.2.0 - Initial release with request node for ctrlX Data Layer.
- 2020-11-28: 1.2.2 - FIX: msg.topic is not set to path if msg.topic is undefined.
- 2020-12-02: 1.2.3 - Only documentation and diagnosis improvements.
- 2020-12-14: 1.2.4 - FIX: Error when request was triggered immediately after deploy.
- 2020-12-20: 1.8.0 - Initial release which adds node to subscribe to ctrlX Data Layer.
                      Support custom port after hostname. E.g. 'localhost:8443'.
- 2020-10-01: 1.8.1 - Fix automatic reconnect when device was not available on start of flow.
- 2021-02-22: 1.8.2 - Switched to ctrlX Data Layer API version v2 which is only available with AutomationCore 1.8.0 or newer.
                      Introduced new setting to request node, which allows to set payload format to return only `value` or `value` and `type`.
- 2021-03-10: 1.8.3 - Internal improvements for more compliant URI encoding of http requests.

## About

Copyright © 2020-2021 Bosch Rexroth AG. All rights reserved.

<https://www.boschrexroth.com>

Bosch Rexroth AG  
Bgm.-Dr.-Nebel-Str. 2  
97816 Lohr am Main  
GERMANY  

## Licenses

MIT License

Copyright (c) 2020-2021, Bosch Rexroth AG

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
