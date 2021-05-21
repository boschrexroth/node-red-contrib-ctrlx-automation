# Examples

This page contains various examples for different use cases. Looking through the examples might help to better understand how to use the nodes for specific tasks.

The example flows can either be imported via the clipboard or by importing directly in the Node-RED editor via the **Import Nodes** Dialog.

![usage_overview_request.png](./images/examples_import_nodes.png)

Keep in mind, that you need to insert valid credentials (username and password) for your device and t adjust your hostname.

## General

### Read the cureent CPU utilitsation on request

![usage_overview_request.png](./images/usage_overview_request.png)

```
[{"id":"765680d3.1c7788","type":"ctrlx-datalayer-request","z":"8a1df649.999ee","device":"9bdd1ac6.4db1c8","method":"READ","path":"framework/metrics/system/cpu-utilisation-percent","payloadFormat":"value","name":"","x":430,"y":140,"wires":[["9195cd7c.d74f3"]]},{"id":"a1661333.e8b348","type":"inject","z":"8a1df649.999ee","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":140,"wires":[["765680d3.1c7788"]]},{"id":"9195cd7c.d74f3","type":"debug","z":"8a1df649.999ee","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":750,"y":140,"wires":[]},{"id":"84d1b245.874028","type":"comment","z":"8a1df649.999ee","name":"Example: Read the current CPU utilisation from the ctrX Data Layer and print to debug log","info":"","x":330,"y":80,"wires":[]},{"id":"9bdd1ac6.4db1c8","type":"ctrlx-config","name":"","hostname":"localhost","debug":false}]
```

### Subscribe to the current CPU utilisation

![usage_overview_subscribe.png](./images/usage_overview_subscribe.png)

```
[{"id":"872cd634.800108","type":"comment","z":"8a1df649.999ee","name":"Example: Subscribe to current CPU utilisation from the ctrX Data Layer and print to debug log","info":"","x":340,"y":240,"wires":[]},{"id":"d921bdd6.1d0b9","type":"ctrlx-datalayer-subscribe","z":"8a1df649.999ee","subscription":"6979a099.efcb18","path":"framework/metrics/system/cpu-utilisation-percent","name":"","x":220,"y":300,"wires":[["ffa838b8.e6db98"]]},{"id":"ffa838b8.e6db98","type":"debug","z":"8a1df649.999ee","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":530,"y":300,"wires":[]},{"id":"6979a099.efcb18","type":"ctrlx-config-subscription","device":"9bdd1ac6.4db1c8","name":"sub1","publishIntervalMs":""},{"id":"9bdd1ac6.4db1c8","type":"ctrlx-config","name":"","hostname":"localhost","debug":false}]
```

### Catch an error in case a node is missing or the node path is invalid

Errors in the nodes can be catched with the Node-RED internal `catch` node.

![examples_catch_error.png](./images/examples_catch_error.png)

```
[{"id":"3984d15c.b6a4be","type":"comment","z":"8a1df649.999ee","name":"Example: Use a catch node to handle errors.","info":"","x":230,"y":420,"wires":[]},{"id":"adcdeb72.352b88","type":"debug","z":"8a1df649.999ee","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":690,"y":480,"wires":[]},{"id":"bf808c7e.2b56a","type":"ctrlx-datalayer-request","z":"8a1df649.999ee","device":"9bdd1ac6.4db1c8","method":"READ","path":"invalid/path/value/to/force/error","name":"","x":410,"y":480,"wires":[["adcdeb72.352b88"]]},{"id":"eda269ff.f06d88","type":"inject","z":"8a1df649.999ee","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":160,"y":480,"wires":[["bf808c7e.2b56a"]]},{"id":"b55ac3d1.719b1","type":"catch","z":"8a1df649.999ee","name":"","scope":["bf808c7e.2b56a"],"uncaught":false,"x":220,"y":560,"wires":[["e91439fb.0fa298"]]},{"id":"e91439fb.0fa298","type":"debug","z":"8a1df649.999ee","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":450,"y":560,"wires":[]},{"id":"9bdd1ac6.4db1c8","type":"ctrlx-config","name":"","hostname":"localhost","debug":false}]
```

## Diagnosis Logbook

### Confirm all errors in the diagnosis logbook

To confirm all errors in the diagnosis logbook you need to send an empty `WRITE` request to `diagnosis/confirm/error`. This can be done by setting the `payload` to null.

![examples_diagnosis_confirm_error.png](./images/examples_diagnosis_confirm_error.png)

```
[{"id":"b5effce.db9fd","type":"comment","z":"8a1df649.999ee","name":"Example: Confirm all diagnosis in the logbook","info":"","x":230,"y":640,"wires":[]},{"id":"477443cd.9b7bd4","type":"debug","z":"8a1df649.999ee","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":730,"y":700,"wires":[]},{"id":"64d6212b.ba6cd","type":"ctrlx-datalayer-request","z":"8a1df649.999ee","device":"9bdd1ac6.4db1c8","method":"WRITE","path":"diagnosis/confirm/error","payloadFormat":"value_type","name":"","x":510,"y":700,"wires":[["477443cd.9b7bd4"]]},{"id":"226bf82.26e5e88","type":"inject","z":"8a1df649.999ee","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":160,"y":700,"wires":[["d4a0a352.ae8488"]]},{"id":"d4a0a352.ae8488","type":"function","z":"8a1df649.999ee","name":"","func":"msg.payload = null;\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":300,"y":700,"wires":[["64d6212b.ba6cd"]]},{"id":"9bdd1ac6.4db1c8","type":"ctrlx-config","name":"","hostname":"localhost","debug":false}]
```

## PLC

For reading and especially writing it might be necessary to better understand how the many types of the IEC61131-3 programming language are mapped to javascript types, which are used in Node-RED. Have a look at the [Data Type Overview](DATATYPES.md) for this.

### Read a PLC variable

The following example shows how to read a PLC variable `i` of type `INT` of a program `PLC_PRG` which has been configured to be part of the symbolic variable configuration.

  ```
  PROGRAM PLC_PRG
  VAR
  	 i: INT;
  END_VAR
  ```

![examples-plc-read-value.png](./images/examples-plc-read-value.png)

```
[{"id":"7467c58b.9bd5ac","type":"ctrlx-datalayer-request","z":"a87ae0cb.f9008","device":"f1d2bfcc.083bf","method":"READ","path":"plc/app/Application/sym/PLC_PRG/i","payloadFormat":"value_type","name":"","x":470,"y":200,"wires":[["8090a7bb.b361"]]},{"id":"8090a7bb.b361","type":"debug","z":"a87ae0cb.f9008","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":750,"y":200,"wires":[]},{"id":"f830ae36.91e878","type":"inject","z":"a87ae0cb.f9008","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":200,"wires":[["7467c58b.9bd5ac"]]},{"id":"76611ca.4da74e4","type":"comment","z":"a87ae0cb.f9008","name":"Example: Read a PLC variable","info":"","x":190,"y":120,"wires":[]},{"id":"f1d2bfcc.083bf","type":"ctrlx-config","name":"","hostname":"localhost","debug":false}]
```

The request returns in `msg.payload`:

```JSON
{
  "type": "int16", 
  "value": 0
}
```

### Write a PLC variable (boolean)

The following example shows how to wriate a boolean PLC variable `b` of type `BOOL` which has been configured for write access via the symbolic variable configuration. Please note, that for writing PLC variable you need to specify the exact type of the PLC variable in the `msg.payload`.

```
PROGRAM PLC_PRG
VAR
  b: BOOL;
END_VAR
```

![examples-plc-write-value-bool.png](./images/examples-plc-write-value-bool.png)

```
[{"id":"501f80f3.0e5068","type":"ctrlx-datalayer-request","z":"a87ae0cb.f9008","device":"f1d2bfcc.083bf","method":"WRITE","path":"plc/app/Application/sym/PLC_PRG/b","payloadFormat":"value_type","name":"","x":470,"y":400,"wires":[["37817780.db70c"]]},{"id":"37817780.db70c","type":"debug","z":"a87ae0cb.f9008","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":750,"y":400,"wires":[]},{"id":"5d059ae1.63156c","type":"inject","z":"a87ae0cb.f9008","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"type\":\"bool8\",\"value\":true}","payloadType":"json","x":190,"y":400,"wires":[["501f80f3.0e5068"]]},{"id":"6466502e.8f8c","type":"comment","z":"a87ae0cb.f9008","name":"Example: Write a PLC variable (BOOL)","info":"","x":210,"y":320,"wires":[]},{"id":"f1d2bfcc.083bf","type":"ctrlx-config","name":"","hostname":"localhost","debug":false}]
```

The request returns in `msg.payload` the written value:

```JSON
{
  "type": "bool8", 
  "value": true
}
```
