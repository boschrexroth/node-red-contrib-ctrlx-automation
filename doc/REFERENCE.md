# Reference

This is the refrence manual of the ***node-red-contrib-ctrlx-automation*** Node-RED nodes to easily connect to [ctrlX AUTOMATION](https://www.ctrlx-automation.com/) devices from [Bosch Rexroth](https://www.boschrexroth.com). It describes the nodes in more detail.
The document contains four main chapters. One for each node.

* `ctrlx-config` Configuration Node
* `Data Layer Request` Node
* `ctrlx-subscription` Configuration Node
* `Data Layer Subscription` Node

## Configuration Node *ctrlx-config*

### Configuration dialog

<img src="./images/node-settings-config.png" alt="Configuration node settings" width="400px"/>

### Configuration properties

#### Address

This configuration attribute is set to the address of the ctrlX AUTOMATION Node-RED device. It can be an IP address or a hostname.  
In case that the node runs directly on a ctrlX CORE device, also *localhost* can be used. It is also possible to define a different port
by appending the port number after a colon. E.g. `192.168.1.1:8443`. By default the node is using port 443 (https).

#### Username / Password

You need a configured user and password for your ctrlX CORE connection.  
Basically, you can use every <strong>user/password</strong> combination which is present in the ctrlX CORE.

<details>
  <summary><strong>Hint:</strong> Use dedicated <strong>credentials</strong> for Node-RED logins</summary>
  It is recommended to configure a dedicated user for your node-RED connection. Only the permissions that are really needed should be assigned.
  <p>This configuration can be done after logging into your ctrlX CORE:
  Go to <strong>-> Settings -> Users & Permissions</strong>.
</details>

#### Name

This is an arbitrary name which is displayed in the Node-RED editor.

#### Debug mode

If checked, the node emits debug information on the ctrlX CORE debug message logger.

The logger can be reached in the ctrlX CORE web interface via **Diagnostics** -> **Logbook**.  
The visibility of the messages has to be activated via the dialogs **setup** icon:

<details>
  <summary>Expand for <strong>screenshot</strong></summary>

<img src="./images/node-red-ui-logbook-settings.png" alt="ctrlX CORE logbook settings" width="200px"/>

</details>

Additionally ***snap.rexroth-node-red.node-red.service*** has to be ckecked in the **Filter** -> **Units** dialog.

<details>
  <summary>Expand for <strong>screenshot</strong></summary>

<img src="./images/node-red-ui-logbook-filter-settings.png" alt="ctrlX CORE logbook filter settings" width="500px"/>

</details>

An example output is shown in the following figure:

<img src="./images/node-red-ui-logbook-output.png" alt="ctrlX CORE logbook output" width="800px"/>

<br>
<br>

## Data Layer Request

The node offers read and write access to/from the ctrlX Data Layer, browsing and creating/deleting objects in the ctrlX Data Layer. It accesses the so called *data nodes* in the Data Layer tree structure which are addressed via a *path* addressing scheme.  

A node basically consists of the following parts:

* Path: An address to uniquly identify this node
* Value: Contains the node data
* Metadata: Additional node information, e.g. data type, unit, displayname.

Access permissions are taken into account in respect to the underlying configuration node settings.

### Configuration dialog

<img src="./images/node-settings-dl-request.png" alt="Data Layer Request node settings" width="400px"/>
<br><br>

### Configuration properties

#### Device

The ctrlX CORE device which was creating with its *Configuration Node* (see above) has to be selected there.

#### Method

This property sets the method to be called. If it is not set, it has to be given via the input `msg.method` attribute.  
Possible values are:

* `READ`: ***Read data*** of the data node represented by the *Path* property.
* `WRITE`: ***Write data*** of the data node represented by the *Path* property.
* `CREATE`: ***Generate*** a resource/subnode at the tree given by the *Path* property.
* `DELETE`: ***Remove*** a resource/subnode at the tree given by the *Path* property.
* `BROWSE`: ***Browsing***, i.e. read the tree subnodes of the given *Path* property.
* `READ_WITH_ARG`: ***Read data*** of the data node represented by the *Path* property. The difference to `READ` is that additional data is given with the read access.
* `METADATA`: ***Read metadata*** of the data node represented by the *Path* property.

#### Path

This property sets the path to the Data Layer node which shall be accessed. If it is not set, it has to be given via the input `msg.path` attribute.  
Examples for a path are `framework/state` or `framework/metrics/system/cpu-utilisation-percent`

The magnifier symbol opens a browsing dialog where all accessible Data Layer nodes are displayed.

#### Payload

This property allows to configure how the payload is returned in case of a `BROWSE`, `READ` or `READ_WITH_ARGS` method or how the payload is expected in case of a `WRITE` or `CREATE` method.
Possible values are:

* `value only`: In this case, only the value of the Data Layer node is returned as a javascript variable in the `msg.payload` variable.
* `value + type (json)`: The `msg.payload` will hold a json object which contains an attribute `value` that contains the value of the Data Layer node and an attribute `type` which contains the Data Layer type encoded as a string.

**Note:** The type-system of the ctrlX Data Layer is more fine granular than the type-system of javascript and Node-RED. For example, in javascript there is only `Number` for all kind of floating-point, signed or unsigned numbers. In the Data Layer exist different kind of distinct data types like in other programming languages. E.g. `int8` , `uint8`, .. ,`int64`, `uint64`, `float`, `double`. When returning the payload as `value only` you will lose the information about the original data value. So depending on your use-case you might chose the right payload format. E.g. if you want to forward the value for display in an user interface the original data type might not be of interest and it is more handy to already have the value in the `msg.payload` variables. In other use-cases, where you might want to do calculations or analytics on top of the values it might be necessary to know the original data type.
For a detailed overview of the different data types and the mapping to javascript have a look at the [data type reference](DATATYPES.md).

**Hint:** Some nodes in the Data Layer expect, that type of the value has to be explicitly specified in case of a `WRITE` request. In this case it is not possible to write the value with the payload setting of `value only` and the node will return a `DL_TYPE_MISMATCH` error. The only chance is to set the payload setting to `value + type (json)` and to provide a json object with `value` and `type` attribute in `msg.payload`. In order to find out which type is expected by the node you can query the documentation of the specific Data Layer node or you may perform a `READ` request on the same node to find out what the returned data type is. Usually, the same data type is expected on a `WRITE` request.

#### Name

This is an arbitrary name which is displayed in the Node-RED editor.

### Inputs of the *Data Layer Request* node

The inputs of the node are given via the attributes `msg.path`, `msg.method`, `msg.payload` and `msg.requestTimeout`.

Some of the attributes are identical to configuration properties of the node. I.e., if the related configuration properties are set via the configuration dialog and via attribute values given in the input `msg`, they should not be different. Otherwise a warning message is emitted.  
In the case that the related configuration properties are left blank within the configuration dialog, the attribute values must be given in the input `msg` part.

#### Input `msg.path`

Same as configuration attribute ***Path***.

#### Input `msg.method`

Same as configuration attribute ***Method*** except set by `msg.method`.

#### Input `msg.payload`

Data to be sent in case of ***WRITE***, ***READ_WITH_ARG*** or ***CREATE*** method.

#### Input `msg.requestTimeout`

If set to a positive number of milliseconds, will override the globally set httpRequestTimeout parameter.
Default: 120000 (2 minutes)

#### Example input `msg`

An example input `msg` containing the input values described above with `READ` access and no `msg.payload` data could be as follows:

<img src="./images/node-inputs-example.png" alt="Input message example" width="400px"/>
<br><br>

<details>
  <summary>Expand for <strong>input message</strong> JSON data (debug window output)</summary>

  ```JSON
  {
    "method": "READ",
    "path": "framework/metrics/system/cpu-utilisation-percent",
    "requestTimeout": 100,
    "_msgid": "b424040c.6715c8"
  }
  ```

</details>

### Outputs of the *Data Layer Request* node

#### Output `msg.payload`

The `msg.payload` contains the data which is given back by the Data Layer Request operation.

Rules exist how the Data Layer variant types are converted into the Node-RED JSON data types.  
A detailed overview is available in the [data type overview](./DATATYPES.md).

#### Output `msg.topic`

If the `msg.topic` property is not already set or is an empty string within the input `msg` object, then it will be set to the effective `path` of the request (see second example output below).

#### Example output `msg`

Example output `msg` when using ***Data Layer Request node properties***:

  ```JSON
  {
    "_msgid": "7d10a368.35a33c",
    "payload": {"type": "double", "value": 3.1}
  }
  ```

Example output `msg` when using input `msg` attributes (with `msg.topic`):

  ```JSON
  {
    "method": "READ",
    "path": "framework/metrics/system/cpu-utilisation-percent",
    "requestTimeout": 100,
    "topic": "framework/metrics/system/cpu-utilisation-percent",
    "_msgid": "d6a822de.b10f7",
    "payload": {"type": "double", "value": 3.1}
  }
  ```

### Diagnosis of the *Data Layer Request* node

#### Node status output

The node status gives some diagnostic information. The following messages may occur:

* Not logged in
* Authenticated (occurs only at flow start)
* Authentication failed (occurs only at flow start)
* Requesting
* Request failed
* Request successful

<img src="./images/node-status.png" alt="Node status example" width="500px"/>
<br><br>

#### Node-RED debug panel output

In case of an error, the node will **not** emit a `msg` but throws an error, that can be caught by the ***catch*** node.  
The errors and warnings are also visible in the Node-RED debug sidebar.

<img src="./images/node-error-debug-sidebar.png" alt="Node error debug output example" width="250px"/>
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

## Configuration Node *ctrlx-config-subscription*

A subscription groups multiple subscribed values to a group which share the same sample time and are processed within the same thread on server side. The *ctrlx-config-subscribe* configuration node represents a subscription of multiple nodes. It is automatically created when the first *Data Layer Subscribe* node is added to the flow and allows the following configuration.

### Configuration dialog

<img src="./images/node-settings-config-subscription.png" alt="Configuration node settings" width="400px"/>

### Configuration properties

#### Device

The ctrlX CORE device which was created with its *Configuration Node* (see above) has to be selected there.

#### Name

This is an arbitrary name which is displayed in the Node-RED editor.

#### Publish Interval

The Publish Interval is the minimum time in milliseconds that the server should use to send new updates. It is used to prevent the server from flooding the client, when the value changes to rapidly.

## Data Layer Subscribe

This node allows to subscribe to value changes of an item in the ctrlX Data Layer. It is an input node, which does not need to be triggered, but automatically emits a new `msg`, when the value changes. This node is very efficient, because it does not poll but only publish server sent events. Monitoring of the value is done on server side. Thus for continuous tracking of value in the ctrlX Data Layer, this node should be preferred of the *Data Layer Request* node.

### Configuration dialog

<img src="./images/node-settings-dl-subscribe.png" alt="Data Layer Subscribe node settings" width="400px"/>
<br><br>

### Configuration properties

#### Subscription

Every single subscribed node belongs to a subscription which groups multiple values to be sampled and published with the same interval inside the server. A subscription that was created as *Subscription Configuration Node* (see above) has to be selected there.

#### Path

This property sets the path to the Data Layer node which shall be subscribed to. 
Examples for a path are `framework/state` or `framework/metrics/system/cpu-utilisation-percent`.

The magnifier symbol opens a browsing dialog where all accessible Data Layer nodes are displayed.

#### Name

This is an arbitrary name which is displayed in the Node-RED editor.

### Outputs of the *Data Layer Subscribe* node

#### Output `msg.payload`

The `msg.payload` contains the value which is given back by the Data Layer Subscribe node.

Rules exist how the Data Layer variant types are converted into the Node-RED JSON data types.  
A detailed overview is available in the [Data Type Overview](./DATATYPES.md).

#### Output `msg.topic`

The `msg.topic` will be set to the effective `path` of the request.

#### Output `msg.type`

The `msg.type` contains the [data type](./DATATYPES.md) of the returned value.

#### Output `msg.timestamp`

The `msg.timestamp` contains the timestamp of the sampled value in milliseconds since January 1, 1970 00:00:00 UTC. It can be easily converted to a javascript `Date` object via `const ts = new Date(msg.timestamp);`.

#### Output `msg.timestampFiletime`

The `msg.timestampFiletime` contains the timestamp of the sampled value in 100-nanosecond intervals since January 1, 1601 00:00:00 UTC. This format is more accurate but rather uncommon in javascript.

#### Example output `msg`

  ```JSON
  {
    "topic": "framework/metrics/system/cpu-utilisation-percent",
    "payload": 11.3,
    "type": "double",
    "timestamp": 1621583770901,
    "timestampFiletime": 132660573709014640,
    "_msgid":"3b670324.e6f9cc"
  }  
  ```

