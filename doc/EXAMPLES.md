# Examples

This page contains various examples for different use cases. Looking through the examples might help to better understand how to use the nodes for specific tasks. Please note that depending on the example different apps have to be present on the system.

## Table of contents

[How to import examples](#how-to-import-examples)

[General examples](#general-examples)

- [Set request properties via msg](#set-request-properties-via-msg)
- [Get web token from authentication server](#get-web-token-from-authentication-server)
- [Read the current CPU utilisation on request](#read-the-current-cpu-utilisation-on-request)
- [Subscribe to the current CPU utilisation](#subscribe-to-the-current-cpu-utilisation)
- [Monitor CPU utilisation in line chart](#monitor-cpu-utilisation-in-line-chart)
- [Use a catch node to handle errors](#use-a-catch-node-to-handle-errors)
- [Subscribe and unsubscribe to a node dynamically](#subscribe-and-unsubscribe-to-a-node-dynamically)

[Diagnosis and Logbook examples](#diagnosis-and-logbook-examples)

- [Read all pending diagnostics](#read-all-pending-diagnostics)
- [Confirm all pending errors in the system diagnostic](#confirm-all-pending-errors-in-the-system-diagnostic)
- [Confirm single pending error in the system diagnostic](#confirm-single-pending-error-in-the-system-diagnostic)
- [Get main diagnostic text](#get-main-diagnostic-text)
- [Get detailed diagnostic text](#get-detailed-diagnostic-text)

[PLC examples](#plc-examples)

- [Read a PLC variable](#read-a-plc-variable)
- [Write a PLC variable (boolean)](#write-a-plc-variable-boolean)

[ctrlX CORE - PLC App dashboard examples](#dashboard-examples-for-ctrlx-core---plc-app)

- [Monitor and handle a boolean PLC variable "bBoolean"]( #monitor-and-handle-a-boolean-plc-variable-bboolean)
- [Monitor and handle an integer PLC variable "iInteger"]( #monitor-and-handle-an-integer-plc-variable-iinteger)
- [Monitor and handle a real PLC variable "rReal"]( #monitor-and-handle-a-real-plc-variable-rreal)
- [Monitor and handle a string PLC variable "sString"]( #monitor-and-handle-a-string-plc-variable-sstring)

[ctrlX CORE - MOTION App dashboard examples](#dashboard-examples-for-ctrlx-core---motion-app)

- [Monitor and switch motion state]( #monitor-and-switch-motion-state)
- [Browse and show all available axes]( #browse-and-show-all-available-axes)
- [Create an axis "AxisX"]( #create-an-axis-axisx)
- [Switch and monitor power of an axis "AxisX"]( #switch-and-monitor-power-of-an-axis-axisx)
- [Monitor position of an axis "AxisX"]( #monitor-position-of-an-axis-axisx)
- [Move an axis "AxisX"]( #move-an-axis-axisx)
- [Abort an axis movement of "AxisX"]( #abort-an-axis-movement-of-axisx)
- [Reset an error of "AxisX"](#reset-an-error-of-axisx)
- [Group axes of kinematic "Robot"]( #group-axes-of-kinematic-robot)
- [Monitor and enable or disable kinematic "Robot"]( #monitor-and-enable-or-disable-kinematic-robot)
- [Move absolute position kinematic "Robot"]( #move-absolute-position-kinematic-robot)
- [Abort kinematic "Robot"]( #abort-kinematic-robot)
- [Reset kinematic "Robot"]( #reset-kinematic-robot)


[Script interpreter and ctrlX CORE - Python Runtime App dashboard examples](#dashboard-examples-for-script-interpreter-and-ctrlx-core---python-runtime-app)

- [Create an interpreter instance "MyInstance" for python]( #create-an-interpreter-instance-myinstance-for-python)
- [Browse and show all available interpreter instances]( #browse-and-show-all-available-interpreter-instances)
- [Monitor state of an interpreter instance "MyInstance"]( #monitor-state-of-an-interpreter-instance-myinstance)
- [Reset interpreter instance "MyInstance"]( #reset-interpreter-instance-myinstance)
- [Execute a python command in an interpreter instance "MyInstance"]( #execute-a-python-command-in-an-interpreter-instance-myinstance)
- [Execute a python file "test.py" in an interpreter instance "MyInstance"]( #execute-a-python-file-testpy-in-an-interpreter-instance-myinstance)
- [Abort an interpreter instance "MyInstance"](#abort-an-interpreter-instance-myinstance)

[ctrlX CORE - EtherCat Master App dashboard examples](#ctrlx-core---ethercat-master-app-dashboard-examples)

- [Monitor and switch state of an EtherCat master instance "ethercatmaster"](#monitor-and-switch-state-of-an-ethercat-master-instance-ethercatmaster)

## How to import examples

The example flows can either be imported via the clipboard or by importing directly in the Node-RED editor via the **Import Nodes** Dialog.

![examples-import-nodes.png](./images/examples-import-nodes.png)

Keep in mind, that you need to insert valid credentials (username and password) for your device and adjust your hostname inside of the communication nodes.
When importing several examples after each other a message `Some of the nodes you are importing already exist in your workspace.` appears. Please choose `View nodes...` and click on `Import selected`. Otherwise you could overwrite existing settings nodes.


## General examples

### Set request properties via msg

![examples-set-request-properties-via-msg.png](./images/examples-set-request-properties-via-msg.png)

```JSON
[{"id":"7d8c9ee.2e8246","type":"comment","z":"b7f42922c8391768","name":"Example: Use the msg object to set the properties programmatically via function node","info":"","x":570,"y":100,"wires":[]},{"id":"c558ee94.94a69","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":1000,"y":160,"wires":[]},{"id":"b21cb94.37f9648","type":"ctrlx-datalayer-request","z":"b7f42922c8391768","device":"7b877229.678964","method":"msg","path":"","name":"","x":760,"y":160,"wires":[["c558ee94.94a69"]]},{"id":"6a8a874a.7d0058","type":"inject","z":"b7f42922c8391768","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":370,"y":160,"wires":[["19b7a2d1.6a030d"]]},{"id":"19b7a2d1.6a030d","type":"function","z":"b7f42922c8391768","name":"set properties","func":"msg.method = 'READ';\nmsg.path = 'framework/metrics/system/cpu-utilisation-percent';\n\nreturn msg;","outputs":1,"noerr":0,"x":550,"y":160,"wires":[["b21cb94.37f9648"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false}]
```

### Get web token from authentication server

The following example shows how to get a web token from ctrlX COREs authentication server. The username and password has to be adapted in the `make header` function.

![examples-get-token.png](./images/examples-get-token.png)

```JSON
[{"id":"af22af4db424ebc6","type":"function","z":"b7f42922c8391768","name":"make header","func":"var newMsg = {};\nnewMsg.header = {};\nnewMsg.header[\"Content-Type\"] = \"application/json\"\nnewMsg.payload =\n    { name: \"boschrexroth\", password: \"boschrexroth\" }\nnewMsg.url = \"https://localhost/identity-manager/api/v2/auth/token\";\nreturn newMsg;\n","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":330,"y":140,"wires":[["0a76057a199ca617"]]},{"id":"0a76057a199ca617","type":"http request","z":"b7f42922c8391768","name":"Get token","method":"POST","ret":"obj","paytoqs":"ignore","url":"","tls":"","persist":false,"proxy":"","insecureHTTPParser":false,"authType":"","senderr":false,"headers":[],"x":500,"y":140,"wires":[["ee4def3e07376b8d"]]},{"id":"ee4def3e07376b8d","type":"debug","z":"b7f42922c8391768","name":"debug 1","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":660,"y":140,"wires":[]},{"id":"c485adb93723e929","type":"inject","z":"b7f42922c8391768","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":160,"y":140,"wires":[["af22af4db424ebc6"]]},{"id":"056e75fc0e45614d","type":"comment","z":"b7f42922c8391768","name":"Get web token from authentication server","info":"","x":240,"y":80,"wires":[]}]
```

### Read the current CPU utilisation on request

![examples-read-CPU-utilisation.png](./images/examples-read-CPU-utilisation.png)

```JSON
[{"id":"765680d3.1c7788","type":"ctrlx-datalayer-request","z":"b7f42922c8391768","device":"7b877229.678964","method":"READ","path":"framework/metrics/system/cpu-utilisation-percent","payloadFormat":"value","name":"","x":690,"y":280,"wires":[["9195cd7c.d74f3"]]},{"id":"a1661333.e8b348","type":"inject","z":"b7f42922c8391768","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":380,"y":280,"wires":[["765680d3.1c7788"]]},{"id":"9195cd7c.d74f3","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":1010,"y":280,"wires":[]},{"id":"84d1b245.874028","type":"comment","z":"b7f42922c8391768","name":"Example: Read the current CPU utilisation from the ctrX Data Layer and print to debug log","info":"","x":590,"y":220,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false}]
```

### Subscribe to the current CPU utilisation

![examples-subscribe-CPU-utilisation.png](./images/examples-subscribe-CPU-utilisation.png)

```JSON
[{"id":"872cd634.800108","type":"comment","z":"b7f42922c8391768","name":"Example: Subscribe to current CPU utilisation from the ctrX Data Layer and print to debug log","info":"","x":580,"y":340,"wires":[]},{"id":"d921bdd6.1d0b9","type":"ctrlx-datalayer-subscribe","z":"b7f42922c8391768","subscription":"632bcc2.eddf134","path":"framework/metrics/system/cpu-utilisation-percent","name":"","x":460,"y":400,"wires":[["ffa838b8.e6db98"]]},{"id":"ffa838b8.e6db98","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":770,"y":400,"wires":[]},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false}]
```

### Monitor CPU utilisation in line chart

The following example shows how to subscribe to the current CPU utilisation and monitor the last 10 values in a line chart.

![example-monitor-cpu-utilisation-linechart.png](./images/example-monitor-cpu-utilisation-linechart.png)
![example-monitor-cpu-utilisation-linechart-dashboard.png](./images/example-monitor-cpu-utilisation-linechart-dashboard.png)

```JSON
[{"id":"beb3ea051cd65ac2","type":"ctrlx-datalayer-subscribe","z":"b7f42922c8391768","subscription":"632bcc2.eddf134","path":"framework/metrics/system/cpu-utilisation-percent","name":"","x":440,"y":480,"wires":[["be8fc64ed0c8ea73"]]},{"id":"dc3e7b2.6ab9388","type":"comment","z":"b7f42922c8391768","name":"Example: Monitor CPU utilisation in line chart","info":"","x":430,"y":440,"wires":[]},{"id":"be8fc64ed0c8ea73","type":"ui_chart","z":"b7f42922c8391768","name":"","group":"a4ba432c81cdab8a","order":0,"width":"0","height":"0","label":"CPU utilisation","chartType":"line","legend":"false","xformat":"auto","interpolate":"linear","nodata":"","dot":true,"ymin":"0","ymax":"100","removeOlder":1,"removeOlderPoints":"10","removeOlderUnit":"60","cutout":0,"useOneColor":false,"useUTC":false,"colors":["#3eb31e","#aec7e8","#ff7f0e","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5"],"outputs":1,"useDifferentColor":false,"className":"","x":760,"y":480,"wires":[[]]},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"a4ba432c81cdab8a","type":"ui_group","name":"General","tab":"9cba2148.8c9148","order":2,"disp":true,"width":"6","collapse":false,"className":""},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Use a catch node to handle errors

Errors in the nodes e.g. node is missing or node path is invalid can be catched with the Node-RED internal `catch` node.

![examples-catch-error.png](./images/examples-catch-error.png)

```JSON
[{"id":"3984d15c.b6a4be","type":"comment","z":"b7f42922c8391768","name":"Example: Use a catch node to handle errors.","info":"","x":430,"y":540,"wires":[]},{"id":"adcdeb72.352b88","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","x":890,"y":600,"wires":[]},{"id":"bf808c7e.2b56a","type":"ctrlx-datalayer-request","z":"b7f42922c8391768","device":"7b877229.678964","method":"READ","path":"invalid/path/value/to/force/error","name":"","x":610,"y":600,"wires":[["adcdeb72.352b88"]]},{"id":"eda269ff.f06d88","type":"inject","z":"b7f42922c8391768","name":"","repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":360,"y":600,"wires":[["bf808c7e.2b56a"]]},{"id":"b55ac3d1.719b1","type":"catch","z":"b7f42922c8391768","name":"","scope":["bf808c7e.2b56a"],"uncaught":false,"x":420,"y":680,"wires":[["e91439fb.0fa298"]]},{"id":"e91439fb.0fa298","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":650,"y":680,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false}]
```

### Subscribe and unsubscribe to a node dynamically

The path of a subscribe node can be set dynamically at runtime.

![example-basic-dynamic-subscription.png](./images/example-basic-dynamic-subscription.png)

```JSON
[{"id":"8c92f714677c9a4a","type":"ctrlx-datalayer-subscribe","z":"e54f652072ad4b5b","subscription":"21664f4efd3d1a9d","path":"","name":"","inputs":1,"x":560,"y":100,"wires":[["ef08e241e0ed21b0"]]},{"id":"792d1c9b693276d8","type":"inject","z":"e54f652072ad4b5b","name":"subscribe","props":[{"p":"action","v":"subscribe","vt":"str"},{"p":"path","v":"framework/metrics/system/cpu-utilisation-percent","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":140,"y":80,"wires":[["8c92f714677c9a4a"]]},{"id":"7a9058067ce9881e","type":"inject","z":"e54f652072ad4b5b","name":"unsubscribe","props":[{"p":"action","v":"unsubscribe","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":150,"y":120,"wires":[["8c92f714677c9a4a"]]},{"id":"ef08e241e0ed21b0","type":"debug","z":"e54f652072ad4b5b","name":"output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":750,"y":100,"wires":[]},{"id":"e53d299d117f8483","type":"comment","z":"e54f652072ad4b5b","name":"Example: Set subscription at runtime","info":"","x":160,"y":40,"wires":[]},{"id":"21664f4efd3d1a9d","type":"ctrlx-config-subscription","device":"bfebf08a.52a46","name":"sub","publishIntervalMs":"100","publishIntervalUnits":"milliseconds","samplingInterval":"","samplingIntervalUnits":"seconds","errorInterval":"","errorIntervalUnits":"seconds","keepaliveInterval":"","keepaliveIntervalUnits":"minutes","queueSize":"","queueBehaviour":"DiscardOldest","deadbandValue":""},{"id":"bfebf08a.52a46","type":"ctrlx-config","name":"localhost","hostname":"192.168.17.190","debug":true}]
```

## Diagnosis and Logbook examples

### Read all pending diagnostics

This Example shows how to read all pending diagnostics via a subscription and show them on the dashboard.

![examples-diagnosis-read-pending-diagnostics.png](./images/examples-diagnosis-read-pending-diagnostics.png)
![examples-diagnosis-read-pending-diagnostics-dashboard.png](./images/examples-diagnosis-read-pending-diagnostics-dashboard.png)


```JSON
[{"id":"af0c0102e0191bc8","type":"ctrlx-datalayer-subscribe","z":"bf7a3579c5656113","subscription":"632bcc2.eddf134","path":"diagnosis/get/actual/list","name":"Read pending diagnostics","x":310,"y":480,"wires":[["367e1ba061c76fec"]]},{"id":"367e1ba061c76fec","type":"function","z":"bf7a3579c5656113","name":"make value","func":"var newMsg = {}\nvar myArray = msg.payload.listDiagnosisIdentificationWithTimestamp\nnewMsg.payload = \"Pending diagnostics:<br>\"\nfor (let index = 0; index < (myArray.length -1); ++index) {\n    newMsg.payload += index + \": \" \n    + myArray[index].diagnosisIdentification.mainDiagnosisNumber \n    + \", \" + myArray[index].diagnosisIdentification.detailedDiagnosisNumber \n    + \", \" + myArray[index].diagnosisIdentification.entity + \";<br>\"\n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":510,"y":480,"wires":[["8eac940b52bde5ae"]]},{"id":"8eac940b52bde5ae","type":"ui_template","z":"bf7a3579c5656113","group":"cd7a7d59d153b666","name":"Show pending diagnostics","order":4,"width":"6","height":"2","format":"<div ng-bind-html=\"msg.payload\"></div>","storeOutMessages":true,"fwdInMessages":true,"resendOnRefresh":true,"templateScope":"local","className":"","x":720,"y":480,"wires":[[]]},{"id":"308321925688e5da","type":"comment","z":"bf7a3579c5656113","name":"Example: Get main diagnosis text","info":"","x":330,"y":440,"wires":[]},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"cd7a7d59d153b666","type":"ui_group","name":"Diagnosis","tab":"9cba2148.8c9148","order":9,"disp":true,"width":"6","collapse":false,"className":""},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Confirm all pending errors in the system diagnostic

This Example shows how to confirm all pending errors in the system diagnostic. An empty `WRITE` request needs to send  to `diagnosis/confirm/error`. This can be done by setting the `payload` to `null`.

![examples-diagnosis-confirm-errors.png](./images/examples-diagnosis-confirm-errors.png)
![examples-diagnosis-confirm-errors-dashboard.png](./images/examples-diagnosis-confirm-errors-dashboard.png)

```JSON
[{"id":"b5effce.db9fd","type":"comment","z":"ec52577b3db3c043","name":"Example: Confirm all pending errors in the system diagnostic","info":"","x":440,"y":700,"wires":[]},{"id":"64d6212b.ba6cd","type":"ctrlx-datalayer-request","z":"ec52577b3db3c043","device":"7b877229.678964","method":"WRITE","path":"diagnosis/confirm/error","payloadFormat":"value_type","name":"","x":870,"y":740,"wires":[[]]},{"id":"226bf82.26e5e88","type":"inject","z":"ec52577b3db3c043","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":340,"y":740,"wires":[["efa89bd3d50d6f25"]]},{"id":"8d40fd0bb68b143c","type":"ui_button","z":"ec52577b3db3c043","name":"","group":"cd7a7d59d153b666","order":1,"width":"3","height":"1","passthru":false,"label":"Confirm errors","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":320,"y":780,"wires":[["efa89bd3d50d6f25"]]},{"id":"efa89bd3d50d6f25","type":"function","z":"ec52577b3db3c043","name":"make confirm errors","func":"msg.payload = null;\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":580,"y":740,"wires":[["64d6212b.ba6cd"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"cd7a7d59d153b666","type":"ui_group","name":"Diagnosis","tab":"9cba2148.8c9148","order":9,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Confirm single pending error in the system diagnostic

This Example shows how to confirm a single pending error in the system diagnostic. Following error is expected to present in the pending diagnostics:

```
Main diagnosis number : "091F2006"
Main diagnosis text : "Axis limit exceeded"
Detailed diagnosis number : "0C560107"
Detailed diagnosis text : "TargetPos max limit exceeded"
Entity : "motion/axs/AxisX" 
```

![examples-diagnosis-confirm-error.png](./images/examples-diagnosis-confirm-error.png)
![examples-diagnosis-confirm-error-dashboard.png](./images/examples-diagnosis-confirm-error-dashboard.png)

```JSON
[{"id":"9c0aca12bc2a9640","type":"function","z":"ec52577b3db3c043","name":"make Confirm error","func":"var newMsg = {};\nnewMsg.payload = { \n  \"type\": \"object\", \n  \"value\": { \n    \"mainDiagnosisNumber\": \"091F2006\", \n    \"detailedDiagnosisNumber\": \"0C560107\", \n    \"entity\": \"motion/axs/AxisX\" \n  } \n}\nreturn newMsg;\n\n","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":570,"y":440,"wires":[["a8efc66b4b7461ef"]]},{"id":"bfe0636f9fe41f01","type":"inject","z":"ec52577b3db3c043","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":340,"y":480,"wires":[["9c0aca12bc2a9640"]]},{"id":"a8efc66b4b7461ef","type":"ctrlx-datalayer-request","z":"ec52577b3db3c043","device":"7b877229.678964","method":"WRITE","path":"diagnosis/confirm/error","payloadFormat":"value_type","name":"Confirm error","x":780,"y":440,"wires":[[]]},{"id":"3edc488be0bb09aa","type":"comment","z":"ec52577b3db3c043","name":"Example: Confirm single pending error \"Axis limit exceeded\"","info":"","x":440,"y":400,"wires":[]},{"id":"9add50cbdef40e90","type":"ui_button","z":"ec52577b3db3c043","name":"","group":"cd7a7d59d153b666","order":1,"width":"3","height":"1","passthru":false,"label":"Confirm error","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":320,"y":440,"wires":[["9c0aca12bc2a9640"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"cd7a7d59d153b666","type":"ui_group","name":"Diagnosis","tab":"9cba2148.8c9148","order":9,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Get main diagnostic text

This Example shows how to get the diagnostic text from the main diagnostic number `091F2006`.

![examples-diagnosis-get-main-diag-text.png](./images/examples-diagnosis-get-main-diag-text.png)
![examples-diagnosis-get-main-diag-text-dashboard](./images/examples-diagnosis-get-main-diag-text-dashboard.png)

```JSON
[{"id":"24e389ee88bbd972","type":"ctrlx-datalayer-request","z":"bf7a3579c5656113","device":"7b877229.678964","method":"READ","path":"","payloadFormat":"value_type","name":"Read main diag text","x":560,"y":640,"wires":[["9cfc3279057259fe"]]},{"id":"96de7236184e1636","type":"function","z":"bf7a3579c5656113","name":"make value","func":"var newMsg = {}\nvar myMainDiagNumber = \"091F2006\"\nnewMsg.path = \"diagnosis/get/text/main?data={ \\\"type\\\": \\\"object\\\", \\\"value\\\": { \\\"mainDiagnosisNumber\\\": \\\"\" + myMainDiagNumber + \"\\\" } }\"\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":370,"y":640,"wires":[["24e389ee88bbd972"]]},{"id":"e45d515b6c331225","type":"comment","z":"bf7a3579c5656113","name":"Example: Get main diagnosis text","info":"","x":170,"y":600,"wires":[]},{"id":"3331e124823b565a","type":"inject","z":"bf7a3579c5656113","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":160,"y":680,"wires":[["96de7236184e1636"]]},{"id":"efcdc0eecbd37d40","type":"ui_button","z":"bf7a3579c5656113","name":"","group":"cd7a7d59d153b666","order":1,"width":"3","height":"1","passthru":false,"label":"Read main diag text","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":160,"y":640,"wires":[["96de7236184e1636"]]},{"id":"9cfc3279057259fe","type":"ui_text","z":"bf7a3579c5656113","group":"cd7a7d59d153b666","order":2,"width":"6","height":"2","name":"","label":"Main diag text","format":"{{msg.payload.value}}","layout":"col-center","className":"","x":760,"y":640,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"cd7a7d59d153b666","type":"ui_group","name":"Diagnosis","tab":"9cba2148.8c9148","order":9,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Get detailed diagnostic text

This Example shows how to get the detailed diagnostic text from the detailed diagnostic number `0C560107` in combination with the related main diagnostic number `091F2006`.

![examples-diagnosis-get-detail-diag-text.png](./images/examples-diagnosis-get-detail-diag-text.png)
![examples-diagnosis-get-detail-diag-text-dashboard](./images/examples-diagnosis-get-detail-diag-text-dashboard.png)

```JSON
[{"id":"24e389ee88bbd972","type":"ctrlx-datalayer-request","z":"bf7a3579c5656113","device":"7b877229.678964","method":"READ","path":"","payloadFormat":"value_type","name":"Read detail diag text","x":560,"y":640,"wires":[["9cfc3279057259fe"]]},{"id":"96de7236184e1636","type":"function","z":"bf7a3579c5656113","name":"make value","func":"var newMsg = {}\nvar myMainDiagNumber = \"091F2006\"\nvar myDetailDiagNumber = \"0C560107\"\nnewMsg.path = \"diagnosis/get/text/detailed?data={ \\\"type\\\": \\\"object\\\", \\\"value\\\": { \\\"detailedDiagnosisNumber\\\": \\\"\" + myDetailDiagNumber + \"\\\", \\\"relatedMainDiagnosisNumber\\\": \\\"\" + myMainDiagNumber + \"\\\" } }\"\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":370,"y":640,"wires":[["24e389ee88bbd972"]]},{"id":"e45d515b6c331225","type":"comment","z":"bf7a3579c5656113","name":"Example: Get detail diagnosis text","info":"","x":180,"y":600,"wires":[]},{"id":"3331e124823b565a","type":"inject","z":"bf7a3579c5656113","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":160,"y":680,"wires":[["96de7236184e1636"]]},{"id":"efcdc0eecbd37d40","type":"ui_button","z":"bf7a3579c5656113","name":"","group":"cd7a7d59d153b666","order":1,"width":"3","height":"1","passthru":false,"label":"Read detail diag text","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":160,"y":640,"wires":[["96de7236184e1636"]]},{"id":"9cfc3279057259fe","type":"ui_text","z":"bf7a3579c5656113","group":"cd7a7d59d153b666","order":2,"width":"6","height":"2","name":"","label":"Detail diag text","format":"{{msg.payload.value}}","layout":"col-center","className":"","x":760,"y":640,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"cd7a7d59d153b666","type":"ui_group","name":"Diagnosis","tab":"9cba2148.8c9148","order":9,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

## PLC examples

For reading and especially writing it might be necessary to better understand how the many types of the IEC61131-3 programming language are mapped to javascript types, which are used in Node-RED. Have a look at the [Data Type Overview](DATATYPES.md) for this.

### Read a PLC variable

The following example shows how to read a PLC variable `i` of type `INT` of a program `PLC_PRG` which has been configured to be part of the symbolic variable configuration.

  ```IEC61131-3
  PROGRAM PLC_PRG
  VAR
    i: INT;
  END_VAR
  ```

![examples-plc-read-value.png](./images/examples-plc-read-value.png)

```JSON
[{"id":"7467c58b.9bd5ac","type":"ctrlx-datalayer-request","z":"b7f42922c8391768","device":"7b877229.678964","method":"READ","path":"plc/app/Application/sym/PLC_PRG/i","payloadFormat":"value_type","name":"","x":670,"y":920,"wires":[["8090a7bb.b361"]]},{"id":"8090a7bb.b361","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":950,"y":920,"wires":[]},{"id":"f830ae36.91e878","type":"inject","z":"b7f42922c8391768","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":400,"y":920,"wires":[["7467c58b.9bd5ac"]]},{"id":"76611ca.4da74e4","type":"comment","z":"b7f42922c8391768","name":"Example: Read a PLC variable","info":"","x":390,"y":840,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false}]
```

The request returns in `msg.payload`:

```JSON
{
  "type": "int16", 
  "value": 0
}
```

### Write a PLC variable (boolean)

The following example shows how to write a boolean PLC variable `b` of type `BOOL` which has been configured for write access via the symbolic variable configuration. Please note, that for writing PLC variable you need to specify the exact type of the PLC variable in the `msg.payload`.

```IEC61131-3
PROGRAM PLC_PRG
VAR
  b: BOOL;
END_VAR
```

![examples-plc-write-value-bool.png](./images/examples-plc-write-value-bool.png)

```JSON
[{"id":"501f80f3.0e5068","type":"ctrlx-datalayer-request","z":"b7f42922c8391768","device":"7b877229.678964","method":"WRITE","path":"plc/app/Application/sym/PLC_PRG/b","payloadFormat":"value_type","name":"","x":670,"y":1060,"wires":[["37817780.db70c"]]},{"id":"37817780.db70c","type":"debug","z":"b7f42922c8391768","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":950,"y":1060,"wires":[]},{"id":"5d059ae1.63156c","type":"inject","z":"b7f42922c8391768","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"type\":\"bool8\",\"value\":true}","payloadType":"json","x":390,"y":1060,"wires":[["501f80f3.0e5068"]]},{"id":"6466502e.8f8c","type":"comment","z":"b7f42922c8391768","name":"Example: Write a PLC variable (BOOL)","info":"","x":410,"y":980,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false}]
```

The request returns in `msg.payload` the written value:

```JSON
{
  "type": "bool8", 
  "value": true
}
```

## ctrlX CORE - PLC App dashboard examples

Please note that for these examples the installation of the ctrlX CORE - PLC App is expected. See [our store](https://developer.community.boschrexroth.com/t5/Store-and-How-to/ctrlX-CORE-PLC-App/ba-p/13298) and the corresponding [documentation of the ctrlX CORE - PLC App](https://docs.automation.boschrexroth.com/doc/729184690/plc-app-plc-runtime-environment-for-ctrlx-core-application-manual/latest/en/).

### Monitor and handle a boolean PLC variable "bBoolean"

The following example shows how to read, write and monitor a PLC variable `bBoolean` of type `BOOL` via the dashboard. A symbol configuration has to be present in the PLC project and the variable has to be configured for write access via a pragma or directly in the symbolic variable configuration. Also the variable has to be used in a program or via pragma. 
Note: A digital IO can be treated the same way.

`GVL`

```IEC61131-3
{attribute 'linkalways'}
{attribute 'symbol' := 'readwrite'}
VAR_GLOBAL
  bBoolean : BOOL;
END_VAR
```

`PLC_PRG`

```IEC61131-3
bBoolean;
```

![example-plc-monitor-handle-boolean.png](./images/example-plc-monitor-handle-boolean.png)
![example-plc-monitor-handle-boolean-dashboard.png](./images/example-plc-monitor-handle-boolean-dashboard.png)

```JSON
[{"id":"c1cc8f5b.e11858","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"WRITE","path":"plc/app/Application/sym/GVL/bBoolean","payloadFormat":"value_type","name":"Write \"bBoolean\" value","x":790,"y":160,"wires":[[]]},{"id":"ec4257d3.ae58b","type":"ui_switch","z":"4ff80d56.dd60fc","name":"","label":"bBoolean ","tooltip":"","group":"938bb9af.bc8108","order":1,"width":"0","height":"0","passthru":false,"decouple":"true","topic":"","topicType":"str","style":"","onvalue":"{\"value\":true,\"type\":\"bool8\"}","onvalueType":"json","onicon":"","oncolor":"","offvalue":"{\"value\":false,\"type\":\"bool8\"}","offvalueType":"json","officon":"","offcolor":"","animate":false,"x":580,"y":160,"wires":[["c1cc8f5b.e11858"]]},{"id":"d2ca5a5e.a1144","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor and handle a boolean PLC variable \"bBoolean\"","info":"","x":300,"y":120,"wires":[]},{"id":"430d03bd.4a9864","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"plc/app/Application/sym/GVL/bBoolean","name":"Read \"bBoolean\" value","x":200,"y":160,"wires":[["d399bf94.d6f75"]]},{"id":"d399bf94.d6f75","type":"function","z":"4ff80d56.dd60fc","name":"make value","func":"var newMsg = {}\nnewMsg.payload = {\"type\":\"bool8\",\"value\":msg.payload}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":410,"y":160,"wires":[["ec4257d3.ae58b"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"938bb9af.bc8108","type":"ui_group","name":"PLC Variable handling","tab":"9cba2148.8c9148","order":1,"disp":true,"width":"4","collapse":false},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Monitor and handle an integer PLC variable "iInteger"

The following example shows how to read, write and monitor a PLC variable `iInteger` of type `INT` via the dashboard. A symbol configuration has to be present in the PLC project and the variable has to be configured for write access via a pragma or directly in the symbolic variable configuration. Also the variable has to be used in a program or via pragma.

`GVL`

```IEC61131-3
{attribute 'linkalways'}
{attribute 'symbol' := 'readwrite'}
VAR_GLOBAL
  iInteger : BOOL;
END_VAR
```

`PLC_PRG`

```IEC61131-3
iInteger;
```

![example-plc-monitor-handle-integer.png](./images/example-plc-monitor-handle-integer.png)
![example-plc-monitor-handle-integer-dashboard.png](./images/example-plc-monitor-handle-integer-dashboard.png)

```JSON
[{"id":"6afd3c5c.85174c","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"WRITE","path":"plc/app/Application/sym/GVL/iInteger","payloadFormat":"value_type","name":"Write \"iInteger\" value","x":780,"y":300,"wires":[[]]},{"id":"699499c0.a19078","type":"ui_text_input","z":"4ff80d56.dd60fc","name":"","label":"iInteger","tooltip":"","group":"938bb9af.bc8108","order":1,"width":0,"height":0,"passthru":false,"mode":"number","delay":"0","topic":"topic","topicType":"msg","x":400,"y":300,"wires":[["dad913ff.7d0c6"]]},{"id":"dad913ff.7d0c6","type":"function","z":"4ff80d56.dd60fc","name":"make value","func":"var newMsg = {}\nnewMsg.payload = {\"type\":\"int16\",\"value\":msg.payload}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":570,"y":300,"wires":[["6afd3c5c.85174c"]]},{"id":"f24564a9.ceb668","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"plc/app/Application/sym/GVL/iInteger","name":"Read \"iInteger\" value","x":200,"y":300,"wires":[["699499c0.a19078"]]},{"id":"1da5cb6a.45e5cd","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor and handle an integer PLC variable \"iInteger\"","info":"","x":300,"y":260,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"938bb9af.bc8108","type":"ui_group","name":"PLC Variable handling","tab":"9cba2148.8c9148","order":1,"disp":true,"width":"4","collapse":false},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Monitor and handle a real PLC variable "rReal"

The following example shows how to read, write and monitor a PLC variable `rReal` of type `REAL` via the dashboard. A symbol configuration has to be present in the PLC project and the variable has to be configured for write access via a pragma or directly in the symbolic variable configuration. Also the variable has to be used in a program or via pragma.

`GVL`

```IEC61131-3
{attribute 'linkalways'}
{attribute 'symbol' := 'readwrite'}
VAR_GLOBAL
  rReal : BOOL;
END_VAR
```

`PLC_PRG`

```IEC61131-3
rReal;
```

![example-plc-monitor-handle-real.png](./images/example-plc-monitor-handle-real.png)
![example-plc-monitor-handle-real-dashboard.png](./images/example-plc-monitor-handle-real-dashboard.png)

```JSON
[{"id":"2c89b6ef.36830a","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"WRITE","path":"plc/app/Application/sym/GVL/rReal","payloadFormat":"value_type","name":"Write \"rReal\" value","x":970,"y":440,"wires":[[]]},{"id":"370f99d.1a78366","type":"ui_text_input","z":"4ff80d56.dd60fc","name":"","label":"rReal","tooltip":"","group":"938bb9af.bc8108","order":1,"width":0,"height":0,"passthru":false,"mode":"number","delay":"0","topic":"topic","topicType":"msg","x":610,"y":440,"wires":[["4f0d75c5.219fc4"]]},{"id":"4f0d75c5.219fc4","type":"function","z":"4ff80d56.dd60fc","name":"make value","func":"var newMsg = {}\nif (msg.payload.value != null){\n    //newMsg.payload = {\"type\":\"float\",\"value\":Number(msg.payload.value)}\n    newMsg.payload = {\"type\":\"float\",\"value\":msg.payload.value}\n}\nelse {\n    //newMsg.payload = {\"type\":\"float\",\"value\":Number(msg.payload)}\n    newMsg.payload = {\"type\":\"float\",\"value\":msg.payload}\n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":770,"y":440,"wires":[["2c89b6ef.36830a"]]},{"id":"5bd100f5.b21dd8","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"plc/app/Application/sym/GVL/rReal","name":"Read \"rReal\" value","x":190,"y":440,"wires":[["17614aa4.d713dd"]]},{"id":"f479d2d0.e553c","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor and handle a real PLC variable \"rReal\"","info":"","x":290,"y":400,"wires":[]},{"id":"17614aa4.d713dd","type":"function","z":"4ff80d56.dd60fc","name":"make value fixed(5)","func":"//msg.test = msg.payload.toFixed(5);\nmsg.payload = Number(msg.payload.toFixed(5));\nreturn msg","outputs":1,"noerr":0,"initialize":"","finalize":"","x":420,"y":440,"wires":[["370f99d.1a78366"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"938bb9af.bc8108","type":"ui_group","name":"PLC Variable handling","tab":"9cba2148.8c9148","order":1,"disp":true,"width":"4","collapse":false},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Monitor and handle a string PLC variable "sString"

The following example shows how to read, write and monitor a PLC variable `sString` of type `STRING` via the dashboard. A symbol configuration has to be present in the PLC project and the variable has to be configured for write access via a pragma or directly in the symbolic variable configuration. Also the variable has to be used in a program or via pragma.

`GVL`

```IEC61131-3
{attribute 'linkalways'}
{attribute 'symbol' := 'readwrite'}
VAR_GLOBAL
  sString : BOOL;
END_VAR
```

`PLC_PRG`

```IEC61131-3
sString;
```

![example-plc-monitor-handle-string.png](./images/example-plc-monitor-handle-string.png)
![example-plc-monitor-handle-string-dashboard.png](./images/example-plc-monitor-handle-string-dashboard.png)

```JSON
[{"id":"52f3b28.7154acc","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"WRITE","path":"plc/app/Application/sym/GVL/sString","payloadFormat":"value_type","name":"Write \"sString\" value","x":780,"y":580,"wires":[[]]},{"id":"a84a6218.d8fa38","type":"ui_text_input","z":"4ff80d56.dd60fc","name":"","label":"sString","tooltip":"","group":"938bb9af.bc8108","order":1,"width":0,"height":0,"passthru":false,"mode":"text","delay":"0","topic":"topic","topicType":"msg","x":400,"y":580,"wires":[["b77fcdb1.bb59e"]]},{"id":"b77fcdb1.bb59e","type":"function","z":"4ff80d56.dd60fc","name":"make value","func":"var newMsg = {}\nnewMsg.payload = {\"type\":\"string\",\"value\":msg.payload}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":570,"y":580,"wires":[["52f3b28.7154acc"]]},{"id":"7fd8a2ba.130acc","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"plc/app/Application/sym/GVL/sString","name":"Read \"sString\" value","x":200,"y":580,"wires":[["a84a6218.d8fa38"]]},{"id":"efa71414.90e038","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor and handle a string PLC variable \"sString\"","info":"","x":310,"y":540,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"938bb9af.bc8108","type":"ui_group","name":"PLC Variable handling","tab":"9cba2148.8c9148","order":1,"disp":true,"width":"4","collapse":false},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

## ctrlX CORE - MOTION App dashboard examples

Please note that for these examples the installation of the ctrlX CORE - MOTION App is expected. See [our store](https://developer.community.boschrexroth.com/t5/Store-and-How-to/ctrlX-CORE-Motion-App/ba-p/13294) and the corresponding [documentation of the ctrlX CORE - MOTION App](https://docs.automation.boschrexroth.com/doc/1993836051/motion-app-motion-laufzeitumgebung-fuer-ctrlx-core-anwendungsbeschreibung/latest/en/).

### Monitor and switch motion state

The following example shows how to switch and monitor the state of the ctrlX MOTION.

![example-motion-monitor-switch-state.png](./images/example-motion-monitor-switch-state.png)
![example-motion-monitor-switch-state-dashboard.png](./images/example-motion-monitor-switch-state-dashboard.png)

```JSON
[{"id":"ffc99584.58bbd","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor and switch motion state","info":"","x":240,"y":780,"wires":[]},{"id":"cac2d7f4.22c55","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"motion/cmd/opstate","payloadFormat":"value_type","name":"Switch motion state","x":850,"y":820,"wires":[[]]},{"id":"60511613.ec7a08","type":"ui_switch","z":"4ff80d56.dd60fc","name":"","label":"Motion state","tooltip":"","group":"372098c9.3029b8","order":1,"width":"3","height":"1","passthru":false,"decouple":"true","topic":"","topicType":"str","style":"","onvalue":"{\"value\":\"Booting\",\"type\":\"string\"}","onvalueType":"json","onicon":"","oncolor":"","offvalue":"{\"value\":\"Configuration\",\"type\":\"string\"}","offvalueType":"json","officon":"","offcolor":"","animate":false,"x":650,"y":820,"wires":[["cac2d7f4.22c55"]]},{"id":"3f74d73d.b1514","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"motion/state/opstate","name":"Read motion state","x":190,"y":820,"wires":[["9c708078.0c74f","ecb0f768.8af99"]]},{"id":"9c708078.0c74f","type":"ui_text","z":"4ff80d56.dd60fc","group":"372098c9.3029b8","order":2,"width":"3","height":"1","name":"","label":"Motion state","format":"{{msg.payload}}","layout":"col-center","x":410,"y":860,"wires":[]},{"id":"ecb0f768.8af99","type":"function","z":"4ff80d56.dd60fc","name":"make switch status","func":"var newMsg = {};\nif(msg.payload == \"Running\"){\n newMsg.payload = {\"value\":\"Booting\",\"type\":\"string\"}\n}\nelse {\n newMsg.payload = {\"value\":\"Configuration\",\"type\":\"string\"} \n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":440,"y":820,"wires":[["60511613.ec7a08"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"372098c9.3029b8","type":"ui_group","name":"Motion handling","tab":"9cba2148.8c9148","order":2,"disp":true,"width":"6","collapse":false},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Browse and show all available axes

The following example shows how to browse and show all available axes of the ctrlX MOTION.

![example-motion-monitor-browse-axes.png](./images/example-motion-monitor-browse-axes.png)
![example-motion-monitor-browse-axes-dashboard.png](./images/example-motion-monitor-browse-axes-dashboard.png)

```JSON
[{"id":"a264954e.592108","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"BROWSE","path":"motion/axs","payloadFormat":"value_type","name":"Browse axes","x":390,"y":980,"wires":[["1500c19c.aef4ce"]]},{"id":"c426d34b.1596e8","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"372098c9.3029b8","order":3,"width":"3","height":"1","passthru":false,"label":"Browse axes","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":200,"y":1020,"wires":[["a264954e.592108"]]},{"id":"916c8ea.af493f","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":true,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":210,"y":980,"wires":[["a264954e.592108"]]},{"id":"1500c19c.aef4ce","type":"function","z":"4ff80d56.dd60fc","name":"make string","func":"var newMsg = {};\nnewMsg.payload = \"\";\nif (msg.payload.value == null){\n    newMsg.payload = \"could not read\";\n}\nelse if(msg.payload.value.length > 0){\n    for (var i = 0; i < msg.payload.value.length; i++) {\n        if(i==0){\n            newMsg.payload += msg.payload.value[i];\n        }\n        else{\n            newMsg.payload += \", \" + msg.payload.value[i];\n        }\n    }\n}\nelse{\n    newMsg.payload = \"no axes found\"\n}\nreturn newMsg;\n","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":580,"y":980,"wires":[["737187dc.883be8"]]},{"id":"737187dc.883be8","type":"ui_text","z":"4ff80d56.dd60fc","group":"372098c9.3029b8","order":5,"width":"0","height":"0","name":"","label":"Axes","format":"{{msg.payload}}","layout":"col-center","x":730,"y":980,"wires":[]},{"id":"3c4502dc.7928ce","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Browse and show all available axes","info":"","x":250,"y":940,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"372098c9.3029b8","type":"ui_group","name":"Motion handling","tab":"9cba2148.8c9148","order":2,"disp":true,"width":"6","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Create an axis "AxisX"

The following example shows how to create a motion object of the type axis with the name `AxisX` in the ctrlX MOTION. The state of the ctrlX MOTION has to be `Configuration`.

![example-motion-create-axis.png](./images/example-motion-create-axis.png)
![example-motion-create-axis-dashboard.png](./images/example-motion-create-axis-dashboard.png)

```JSON
[{"id":"359e6180.4b2b4e","type":"function","z":"4ff80d56.dd60fc","name":"make create command","func":"var newMsg = {};\nnewMsg.payload = {\"type\":\"string\",\"value\":\"AxisX\"}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":450,"y":1140,"wires":[["166a0be8.1525fc"]]},{"id":"166a0be8.1525fc","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"motion/axs","payloadFormat":"value_type","name":"Create \"AxisX\"","x":680,"y":1140,"wires":[[]]},{"id":"2228f62a.ade41a","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Create an axis \"AxisX\"","info":"","x":210,"y":1100,"wires":[]},{"id":"586a2197.7b6c98","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"372098c9.3029b8","order":4,"width":"3","height":"1","passthru":false,"label":"Create \"AxisX\"","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":220,"y":1180,"wires":[["359e6180.4b2b4e"]]},{"id":"34651a40.a492fe","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":210,"y":1140,"wires":[["359e6180.4b2b4e"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"372098c9.3029b8","type":"ui_group","name":"Motion handling","tab":"9cba2148.8c9148","order":2,"disp":true,"width":"6","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Switch and monitor power of an axis "AxisX"

The following example shows how to switch and monitor the power state of a motion axis `AxisX` in the ctrlX MOTION. The corresponding motion object has to be present and the state of the ctrlX MOTION has to be `Running`.

![example-motion-power-axis.png](./images/example-motion-power-axis.png)
![example-motion-power-axis-dashboard.png](./images/example-motion-power-axis-dashboard.png)

```JSON
[{"id":"7598c8e9.423f28","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Switch and monitor power of an axis \"AxisX\"","info":"","x":280,"y":1380,"wires":[]},{"id":"f3001db9.f1ac5","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"motion/axs/AxisX/cmd/power","payloadFormat":"value_type","name":"Write \"AxisX\" Power","x":1080,"y":1420,"wires":[["ec10e282.671738"]]},{"id":"f790e337.3bfc98","type":"ui_switch","z":"4ff80d56.dd60fc","name":"","label":"Power \"AxisX\"","tooltip":"","group":"eb7620ae.6f5d","order":1,"width":"4","height":"1","passthru":false,"decouple":"true","topic":"","topicType":"str","style":"","onvalue":"{\"value\":true,\"type\":\"bool8\"}","onvalueType":"json","onicon":"","oncolor":"","offvalue":"{\"value\":false,\"type\":\"bool8\"}","offvalueType":"json","officon":"","offcolor":"","animate":false,"x":880,"y":1420,"wires":[["f3001db9.f1ac5"]]},{"id":"ec10e282.671738","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"READ","path":"motion/axs/AxisX/state/opstate/plcopen","payloadFormat":"value_type","name":"Read \"AxisX\" Power","x":440,"y":1420,"wires":[["be2d941e.9651c8"]]},{"id":"be2d941e.9651c8","type":"function","z":"4ff80d56.dd60fc","name":"make switch status","func":"var newMsg = {};\nif(msg.payload.value == \"OUTDATED\"){\n newMsg.payload = {\"type\":\"bool8\",\"value\":false} \n}\nelse if(msg.payload.value == \"DISABLED\") {\n newMsg.payload = {\"type\":\"bool8\",\"value\":false}\n} \nelse if(msg.payload.value == \"COORDINATED_MOTION_DISABLED\") {\n newMsg.payload = {\"type\":\"bool8\",\"value\":false} \n}\nelse if(msg.payload.value == \"ERRORSTOP\") {\n newMsg.payload = {\"type\":\"bool8\",\"value\":false} \n}\nelse {\n newMsg.payload = {\"type\":\"bool8\",\"value\":true} \n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":670,"y":1420,"wires":[["f790e337.3bfc98"]]},{"id":"bb714120.4807d","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":true,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":1420,"wires":[["ec10e282.671738"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"eb7620ae.6f5d","type":"ui_group","name":"Axes handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"5","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Monitor position of an axis "AxisX"

The following example shows how to monitor the interpolated position of a motion axis `AxisX` in the ctrlX MOTION. The corresponding motion object has to be present and the state of the ctrlX MOTION has to be `Running`.

![example-motion-monitor-position-axes.png](./images/example-motion-monitor-position-axes.png)
![example-motion-monitor-position-axes-dashboard.png](./images/example-motion-monitor-position-axes-dashboard.png)

```JSON
[{"id":"657f7c1a.cf6cec","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"motion/axs/AxisX/state/values/ipo/pos/mm","name":"Read \"AxisX\" pos","x":160,"y":1560,"wires":[["1cfdc1d6.d4e5de"]]},{"id":"85fa0533.8ab3d8","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor position of an axis \"AxisX\"","info":"","x":240,"y":1520,"wires":[]},{"id":"122d92a4.f6a56d","type":"ui_text","z":"4ff80d56.dd60fc","group":"eb7620ae.6f5d","order":2,"width":"3","height":"1","name":"","label":"Position \"AxisX\"","format":"{{msg.payload}}","layout":"col-center","x":620,"y":1560,"wires":[]},{"id":"1cfdc1d6.d4e5de","type":"function","z":"4ff80d56.dd60fc","name":"make value fixed(2)","func":"var newMsg = {};\nnewMsg.payload = msg.payload.toFixed(2);\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":390,"y":1560,"wires":[["122d92a4.f6a56d"]]},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"eb7620ae.6f5d","type":"ui_group","name":"Axes handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"5","collapse":false},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Move an axis "AxisX"

The following example shows how to move a motion axis `AxisX` in the ctrlX MOTION to position = 10 with velocity, acceleration, deceleration = 10 and jerk = 0. The state of the ctrlX MOTION has to be `Running`. The corresponding motion object has to be present and its state has to be `STANDSTILL` (powered on, [see axis state machine documentation](https://docs.automation.boschrexroth.com/doc/359516816/axis-objects/latest/en/)).

![example-motion-move-axis.png](./images/example-motion-move-axis.png)
![example-motion-move-axis-dashboard.png](./images/example-motion-move-axis-dashboard.png)

```JSON
[{"id":"ef2f6f42.26f6b8","type":"function","z":"4ff80d56.dd60fc","name":"make pos command","func":"var newMsg = {};\nnewMsg.payload = {\n      \"type\":\"object\",\n      \"value\":{\n\t    \"axsPos\":\"10\",\"buffered\":false,\"lim\":{\"vel\":\"10\",\"acc\":\"10\",\"dec\":\"10\",\"jrkAcc\":\"0\",\"jrkDec\":\"0\"}\n\t    }\n     }\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","x":440,"y":1680,"wires":[["c27d8d3a.aba638"]]},{"id":"c27d8d3a.aba638","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"motion/axs/AxisX/cmd/pos-abs","payloadFormat":"value_type","name":"\"AxisX\" pos abs","x":670,"y":1680,"wires":[[]]},{"id":"569584de.0946e4","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Move an axis \"AxisX\"","info":"","x":200,"y":1640,"wires":[]},{"id":"fcc3bed0.080f48","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"eb7620ae.6f5d","order":3,"width":"2","height":"1","passthru":false,"label":"Move \"AxisX\"","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":220,"y":1720,"wires":[["ef2f6f42.26f6b8"]]},{"id":"14a61d63.0cf1ab","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":1680,"wires":[["ef2f6f42.26f6b8"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"eb7620ae.6f5d","type":"ui_group","name":"Axes handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"5","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Abort an axis movement of "AxisX"

The following example shows how to abort an movement of a motion axis `AxisX` in the ctrlX MOTION with deceleration = 10 and jerk = 0. The state of the ctrlX MOTION has to be `Running`. The corresponding motion object has to be present and its state has to be `DISCRETE_MOTION` ([see axis state machine documentation](https://docs.automation.boschrexroth.com/doc/359516816/axis-objects/latest/en/)).

![example-motion-abort-axis-movement.png](./images/example-motion-abort-axis-movement.png)
![example-motion-abort-axis-movement-dashboard.png](./images/example-motion-abort-axis-movement-dashboard.png)

```JSON
[{"id":"79e751dd.c8402","type":"function","z":"4ff80d56.dd60fc","name":"make abort command","func":"var newMsg = {};\nnewMsg.payload = {\n      \"type\":\"object\",\n      \"value\":{\"dec\":\"10\",\"jrkDec\":\"0\"}\n     }\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":440,"y":1840,"wires":[["7cb11da0.1916bc"]]},{"id":"7cb11da0.1916bc","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"motion/axs/AxisX/cmd/abort","payloadFormat":"value_type","name":"\"AxisX\" abort","x":660,"y":1840,"wires":[[]]},{"id":"dc3e7b2.6ab9388","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Abort an axis movement of \"AxisX\"","info":"","x":240,"y":1800,"wires":[]},{"id":"a11e7b1a.b3a8d","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"eb7620ae.6f5d","order":3,"width":"2","height":"1","passthru":false,"label":"Stop \"AxisX\"","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":210,"y":1880,"wires":[["79e751dd.c8402"]]},{"id":"690b0e68.ffc46","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":1840,"wires":[["79e751dd.c8402"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"eb7620ae.6f5d","type":"ui_group","name":"Axes handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"5","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Reset an error of "AxisX"

The following example shows how to reset an error of a motion axis `AxisX` in the ctrlX MOTION. The state of the ctrlX MOTION has to be `Running`. The corresponding motion object has to be present and its state has to be `ERRORSTOP` ([see axis state machine documentation](https://docs.automation.boschrexroth.com/doc/359516816/axis-objects/latest/en/)).

![example-motion-reset-axis-error.png](./images/example-motion-reset-axis-error.png)
![example-motion-reset-axis-error-dashboard.png](./images/example-motion-reset-axis-error-dashboard.png)

```JSON
[{"id":"d134226bd80e1be5","type":"function","z":"ec52577b3db3c043","name":"make Reset error","func":"var newMsg = {};\nnewMsg.payload = null\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":590,"y":280,"wires":[["c654bbe59916dcd8"]]},{"id":"c654bbe59916dcd8","type":"ctrlx-datalayer-request","z":"ec52577b3db3c043","device":"7b877229.678964","method":"CREATE","path":"motion/axs/AxisX/cmd/reset","payloadFormat":"value_type","name":"Reset error of \"AxisX\"","x":820,"y":280,"wires":[[]]},{"id":"ee10a5d37883f0b2","type":"comment","z":"ec52577b3db3c043","name":"Example: Reset error of \"AxisX\"","info":"","x":350,"y":240,"wires":[]},{"id":"7e4f970aeb1a9af7","type":"ui_button","z":"ec52577b3db3c043","name":"","group":"eb7620ae.6f5d","order":4,"width":"3","height":"1","passthru":false,"label":"Reset error of \"AxisX\"","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":340,"y":320,"wires":[["d134226bd80e1be5"]]},{"id":"a68723ea4473153d","type":"inject","z":"ec52577b3db3c043","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":340,"y":280,"wires":[["d134226bd80e1be5"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"eb7620ae.6f5d","type":"ui_group","name":"Axes handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"5","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```
### Group axes of kinematic "Robot"

The following example shows how to add the axes ("X","Y","Z") to a kinematic group "Robot". Each axis grouped must be defined in the kinematic axes. Axis states must be `STANDSTILL`. This command will transition the grouped axes into state `COORDINATED_MOTION`. Axes must be grouped and the kinematic must be enabled prior to physical motion.

![example-motion-group-kinematic-axes.png](./images/example-motion-group-kinematic-axes.png)
![example-motion-group-kinematic-axes-dashboard.png](./images/example-motion-group-kinematic-axes-dashboard.png)

```JSON
[{"id":"57f25cb632d4c907","type":"function","z":"3f1e15ba92536e91","name":"group command","func":"var newMsg = {};\nnewMsg.payload = {\n    \"type\": \"object\",\n    \"value\": {\n        \"kinName\": \"Robot\",\n        \"buffered\": false\n    }\n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":380,"y":200,"wires":[["6a752590b2876ba5","49122ab1c98b446b","c0da08a13cfeda35"]]},{"id":"6a752590b2876ba5","type":"ctrlx-datalayer-request","z":"3f1e15ba92536e91","device":"7b877229.678964","method":"CREATE","path":"motion/axs/X/cmd/add-to-kin","payloadFormat":"value_type","name":"\"X\" axis add to kinematic","x":650,"y":140,"wires":[[]]},{"id":"a42e5536c1a2763e","type":"ui_button","z":"3f1e15ba92536e91","name":"","group":"85755e14b124f041","order":3,"width":"3","height":"1","passthru":false,"label":"Group \"Robot\"","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":180,"y":200,"wires":[["57f25cb632d4c907"]]},{"id":"b5d6748b8bc10a6a","type":"inject","z":"3f1e15ba92536e91","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":160,"wires":[["57f25cb632d4c907"]]},{"id":"aa78fd51fee8f256","type":"comment","z":"3f1e15ba92536e91","name":"Example: Group axes of kinematic \"Robot\"","info":"","x":220,"y":120,"wires":[]},{"id":"49122ab1c98b446b","type":"ctrlx-datalayer-request","z":"3f1e15ba92536e91","device":"7b877229.678964","method":"CREATE","path":"motion/axs/Y/cmd/add-to-kin","payloadFormat":"value_type","name":"\"Y\" axis add to kinematic","x":650,"y":200,"wires":[[]]},{"id":"c0da08a13cfeda35","type":"ctrlx-datalayer-request","z":"3f1e15ba92536e91","device":"7b877229.678964","method":"CREATE","path":"motion/axs/Z/cmd/add-to-kin","payloadFormat":"value_type","name":"\"Z\" axis add to kinematic","x":650,"y":260,"wires":[[]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"85755e14b124f041","type":"ui_group","name":"Kinematic Handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Monitor and enable or disable kinematic "Robot"

The following example shows how to monitor, enable and disable the kinematic group "Robot". Axis states can be `STANDSTILL` or `COORDINATED_MOTION` after grouping. Axes must be grouped and the kinematic must be enabled prior to physical axis motion.

![example-motion-monitor-enable-disable-kinematic.png](./images/example-motion-monitor-enable-disable-kinematic.png)
![example-motion-monitor-enable-disable-kinematic-dashboard.png](./images/example-motion-monitor-enable-disable-kinematic-dashboard.png)

```JSON
[{"id":"dbd40709a3863a5e","type":"comment","z":"3a89ede8547cbb8b","name":"Example: Monitor and switch \"Robot\" enable","info":"","x":270,"y":80,"wires":[]},{"id":"f790e337.3bfc98","type":"ui_switch","z":"3a89ede8547cbb8b","name":"","label":"Enable/disable \"Robot\"","tooltip":"","group":"85755e14b124f041","order":1,"width":"4","height":"1","passthru":true,"decouple":"false","topic":"","topicType":"str","style":"","onvalue":"{\"type\":\"bool8\",\"value\":true}","onvalueType":"json","onicon":"","oncolor":"","offvalue":"{\"type\":\"bool8\",\"value\":false}","offvalueType":"json","officon":"","offcolor":"","animate":false,"className":"","x":860,"y":120,"wires":[["77300d87e2d6473c"]]},{"id":"bb714120.4807d","type":"inject","z":"3a89ede8547cbb8b","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":120,"wires":[["e7133e025a1f4c5c"]]},{"id":"343c07da133a2dba","type":"ctrlx-datalayer-request","z":"3a89ede8547cbb8b","device":"7b877229.678964","method":"CREATE","path":"motion/kin/Robot/cmd/group-ena","payloadFormat":"value_type","name":"\"Robot\" enable","x":840,"y":180,"wires":[[]]},{"id":"7f52506b8bfcaedb","type":"ctrlx-datalayer-request","z":"3a89ede8547cbb8b","device":"7b877229.678964","method":"CREATE","path":"motion/kin/Robot/cmd/group-dis","payloadFormat":"value_type","name":"\"Robot\" disable","x":840,"y":240,"wires":[[]]},{"id":"77300d87e2d6473c","type":"switch","z":"3a89ede8547cbb8b","name":"","property":"payload.value","propertyType":"msg","rules":[{"t":"true"},{"t":"false"}],"checkall":"false","repair":false,"outputs":2,"x":190,"y":220,"wires":[["e657d3a6d594ef34"],["785978fba9bc8cfe"]]},{"id":"e657d3a6d594ef34","type":"function","z":"3a89ede8547cbb8b","name":"make enable command","func":"var newMsg = {};\nnewMsg.payload = \"\";\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":430,"y":200,"wires":[["343c07da133a2dba"]]},{"id":"785978fba9bc8cfe","type":"function","z":"3a89ede8547cbb8b","name":"make disable command","func":"var newMsg = {};\nnewMsg.payload = \"\";\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":430,"y":240,"wires":[["7f52506b8bfcaedb"]]},{"id":"e7133e025a1f4c5c","type":"ctrlx-datalayer-request","z":"3a89ede8547cbb8b","device":"7b877229.678964","method":"READ","path":"motion/kin/Robot/state/opstate/plcopen","payloadFormat":"value_type","name":"Read \"Robot\" enable status","x":420,"y":120,"wires":[["86a4485d88dd3f70"]]},{"id":"86a4485d88dd3f70","type":"function","z":"3a89ede8547cbb8b","name":"make switch status","func":"var newMsg = {};\nif(msg.payload.value == \"DISABLED\") {\n newMsg.payload = {\"type\":\"bool8\",\"value\":true}\n} \nelse {\n newMsg.payload = {\"type\":\"bool8\",\"value\":false} \n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":650,"y":120,"wires":[["f790e337.3bfc98"]]},{"id":"85755e14b124f041","type":"ui_group","name":"Kinematic Handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"6","collapse":false,"className":""},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Move absolute position kinematic "Robot"

The following example shows how to request an absolute position move of a kinematic "Robot". If the command is initiated with axis states `STANDSTILL`, this will produce a virtual move of the kinematic. To move physical axes, axis states must be `COORDINATED_MOTION`. An example startup sequence is then: power on, group axes to kinematic, enable kinematic, request move.

![example-motion-move-absolute-kinematic.png](./images/example-motion-move-absolute-kinematic.png)
![example-motion-move-absolute-kinematic-dashboard.png](./images/example-motion-move-absolute-kinematic-dashboard.png)

```JSON
[{"id":"a4b5f4ddf588ea6a","type":"function","z":"49a0fa857f86c38c","name":"make pos command","func":"var newMsg = {};\nnewMsg.payload = {\n    \"type\": \"object\",\n    \"value\": {\n        \"kinPos\": [15.5, 12.0, 3.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],\n        \"coordSys\": \"WCS\",\n        \"lim\": {\n            \"vel\": 800,\n            \"acc\": 3,\n            \"dec\": 3,\n            \"jrkAcc\": 0,\n            \"jrkDec\": 0\n        }\n    }\n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":420,"y":120,"wires":[["5071eee48d45d006"]]},{"id":"5071eee48d45d006","type":"ctrlx-datalayer-request","z":"49a0fa857f86c38c","device":"7b877229.678964","method":"CREATE","path":"motion/kin/Robot/cmd/move-abs","payloadFormat":"value_type","name":"\"Robot\" pos abs","x":660,"y":120,"wires":[[]]},{"id":"ed595e644b52bb5c","type":"ui_button","z":"49a0fa857f86c38c","name":"","group":"85755e14b124f041","order":3,"width":"3","height":"1","passthru":false,"label":"Move \"Robot\"","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":200,"y":160,"wires":[["a4b5f4ddf588ea6a"]]},{"id":"04d0b8522adbe49e","type":"inject","z":"49a0fa857f86c38c","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":120,"wires":[["a4b5f4ddf588ea6a"]]},{"id":"6ab024b45f88f622","type":"comment","z":"49a0fa857f86c38c","name":"Example: Move absolute kinematic \"Robot\"","info":"","x":220,"y":80,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"85755e14b124f041","type":"ui_group","name":"Kinematic Handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Abort kinematic "Robot"

The following example shows how to abort the kinematic "Robot". This command can be issued in state `MOVING` or `STANDBY`. It will transition the kinematic into state `ABORTING`. Once the stopping motion is complete, the kinematic transitions to state `STANDBY` and all buffered commands are removed.

![example-motion-abort-kinematic.png](./images/example-motion-abort-kinematic.png)
![example-motion-abort-kinematic-dashboard.png](./images/example-motion-abort-kinematic-dashboard.png)

```JSON
[{"id":"563e15c2db30bf28","type":"ctrlx-datalayer-request","z":"201ba7c7148a7cc2","device":"7b877229.678964","method":"CREATE","path":"motion/kin/Robot/cmd/abort","payloadFormat":"value_type","name":"\"Robot\" abort","x":670,"y":120,"wires":[[]]},{"id":"ac7a8b1446a1e812","type":"ui_button","z":"201ba7c7148a7cc2","name":"","group":"85755e14b124f041","order":3,"width":"3","height":"1","passthru":false,"label":"Abort \"Robot\"","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":220,"y":160,"wires":[["558c61d4c8d9c1ac"]]},{"id":"4175c5684253f0db","type":"inject","z":"201ba7c7148a7cc2","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":120,"wires":[["558c61d4c8d9c1ac"]]},{"id":"64da5a64be4f7a30","type":"comment","z":"201ba7c7148a7cc2","name":"Example: Abort command kinematic \"Robot\"","info":"","x":250,"y":80,"wires":[]},{"id":"558c61d4c8d9c1ac","type":"function","z":"201ba7c7148a7cc2","name":"make abort command","func":"var newMsg = {};\nnewMsg.payload = {\n    \"type\": \"object\",\n    \"value\": {}\n};\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":440,"y":120,"wires":[["563e15c2db30bf28"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"85755e14b124f041","type":"ui_group","name":"Kinematic Handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Reset kinematic "Robot"

The following example shows how to reset errors for the kinematic "Robot". If the errors are minor, subordinate axes are also reset and the kinematic transitions to state `STANDBY`. In the case of severe errors, subordinate axes are not reset and the kinematic transitions to state `DISABLED`.

![example-motion-reset-kinematic.png](./images/example-motion-reset-kinematic.png)
![example-motion-reset-kinematic-dashboard.png](./images/example-motion-reset-kinematic-dashboard.png)

```JSON
[{"id":"295d31e596bb3952","type":"ctrlx-datalayer-request","z":"0c66745436523bb7","device":"7b877229.678964","method":"CREATE","path":"motion/kin/Robot/cmd/reset","payloadFormat":"value_type","name":"\"Robot\" reset","x":710,"y":100,"wires":[[]]},{"id":"aed8d5115b8cc229","type":"ui_button","z":"0c66745436523bb7","name":"","group":"85755e14b124f041","order":3,"width":"3","height":"1","passthru":false,"label":"Reset \"Robot\"","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":260,"y":140,"wires":[["b3a6dc57db58af3a"]]},{"id":"7638c60369720b4f","type":"inject","z":"0c66745436523bb7","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":240,"y":100,"wires":[["b3a6dc57db58af3a"]]},{"id":"0610da93a6d6a7f1","type":"comment","z":"0c66745436523bb7","name":"Example: Reset kinematic \"Robot\"","info":"","x":260,"y":60,"wires":[]},{"id":"b3a6dc57db58af3a","type":"function","z":"0c66745436523bb7","name":"make reset command","func":"var newMsg = {};\nnewMsg.payload = {\n    \"type\": \"object\",\n    \"value\": {}\n};\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":480,"y":100,"wires":[["295d31e596bb3952"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"85755e14b124f041","type":"ui_group","name":"Kinematic Handling","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

## Script interpreter and ctrlX CORE - Python Runtime App dashboard examples

Please note that for these examples the installation of the `ctrlX CORE - Python Runtime App` is expected. See [our store](https://developer.community.boschrexroth.com/t5/Store-and-How-to/ctrlX-CORE-Python-Runtime-App/ba-p/15901) and the corresponding [documentation of the "Script parser/interpreter (Python)"](https://docs.automation.boschrexroth.com/doc/2758030364/script-parser-interpreter-python/latest/en/).

### Create an interpreter instance "MyInstance" for python

The following example shows how to create an interpreter instance `MyInstance` for executing python code/scripts.

![example-interpreter-create-instance.png](./images/example-interpreter-create-instance.png)
![example-interpreter-create-instance-dashboard.png](./images/example-interpreter-create-instance-dashboard.png)

```JSON
[{"id":"41a67c09.9532e4","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Create an interpreter instance \"MyInstance\" for python","info":"","x":310,"y":1960,"wires":[]},{"id":"32d49076.f8923","type":"function","z":"4ff80d56.dd60fc","name":"make create command","func":"var newMsg = {};\nnewMsg.payload = {\n      \"type\":\"object\",\n      \"value\":{\n\t    \"name\":\"MyInstance\",\"language\":\"python\"\n        }\n     }\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":420,"y":2000,"wires":[["b3d753e.4376c3"]]},{"id":"b3d753e.4376c3","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"script/instances","payloadFormat":"value_type","name":"Create Instance \"MyInstance\"","x":690,"y":2000,"wires":[[]]},{"id":"3cf2344c.df7184","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":2040,"wires":[["32d49076.f8923"]]},{"id":"18c49496.2cf273","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"f675e9d2.c9935","order":1,"width":"3","height":"1","passthru":false,"label":"Create Instance","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":180,"y":2000,"wires":[["32d49076.f8923"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Browse and show all available interpreter instances

The following example shows how to browse and show all available instances of the ctrlX script manager.

![example-motion-monitor-browse-instances.png](./images/example-motion-monitor-browse-instances.png)
![example-motion-monitor-browse-instances-dashboard.png](./images/example-motion-monitor-browse-instances-dashboard.png)

```JSON
[{"id":"54d27d.03212584","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"BROWSE","path":"script/instances","payloadFormat":"value_type","name":"Browse instances","x":430,"y":2160,"wires":[["474a1b6.70f72e4"]]},{"id":"5346646a.c4a73c","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"f675e9d2.c9935","order":2,"width":"3","height":"1","passthru":false,"label":"Browse instances","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":200,"y":2200,"wires":[["54d27d.03212584"]]},{"id":"90a22cfc.a01b18","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":true,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":190,"y":2160,"wires":[["54d27d.03212584"]]},{"id":"474a1b6.70f72e4","type":"function","z":"4ff80d56.dd60fc","name":"make string","func":"var newMsg = {};\nnewMsg.payload = \"\";\nif (msg.payload.value == null){\n    newMsg.payload = \"could not read\";\n}\nelse if(msg.payload.value.length > 0){\n    for (var i = 0; i < msg.payload.value.length; i++) {\n        if(i==0){\n            newMsg.payload += msg.payload.value[i];\n        }\n        else{\n            newMsg.payload += \", \" + msg.payload.value[i];\n        }\n    }\n}\nelse{\n    newMsg.payload = \"no instances found\"\n}\nreturn newMsg;\n","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":630,"y":2160,"wires":[["f1db1731.1867c"]]},{"id":"f1db1731.1867c","type":"ui_text","z":"4ff80d56.dd60fc","group":"f675e9d2.c9935","order":3,"width":"0","height":"0","name":"","label":"Instances","format":"{{msg.payload}}","layout":"col-center","x":800,"y":2160,"wires":[]},{"id":"4881365b.cb4c1","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Browse and show all available interpreter instances","info":"","x":250,"y":2120,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Monitor state of an interpreter instance "MyInstance"

The following example shows how to monitor the state of an instances `MyInstance` of the ctrlX script manager ([see instance state machine](https://docs.automation.boschrexroth.com/doc/2359488747/user-interface-via-data-layer/latest/en/)).

![example-motion-monitor-state-instance.png](./images/example-motion-monitor-state-instance.png)
![example-motion-monitor-state-instance-dashboard.png](./images/example-motion-monitor-state-instance-dashboard.png)

```JSON
[{"id":"9b9e6fbd.7416e8","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Monitor state of an interpreter instance \"MyInstance\"","info":"","x":250,"y":2280,"wires":[]},{"id":"59b3f37.f33bf0c","type":"ctrlx-datalayer-subscribe","z":"4ff80d56.dd60fc","subscription":"632bcc2.eddf134","path":"script/instances/MyInstance/state/opstate","name":"Read instance state","x":170,"y":2320,"wires":[["4d250434.d9cf1c"]]},{"id":"4d250434.d9cf1c","type":"ui_text","z":"4ff80d56.dd60fc","group":"f675e9d2.c9935","order":4,"width":"4","height":"1","name":"","label":"\"MyInstance\" state","format":"{{msg.payload}}","layout":"col-center","x":410,"y":2320,"wires":[]},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Reset interpreter instance "MyInstance"

The following example shows how to reset a script interpreter instance `MyInstance`. The corresponding instance has to be present and in state `ERROR` ([see instance state machine](https://docs.automation.boschrexroth.com/doc/2359488747/user-interface-via-data-layer/latest/en/)). 

![example-interpreter-python-reset-instance.png](./images/example-interpreter-python-reset-instance.png)
![example-interpreter-python-reset-instance-dashboard.png](./images/example-interpreter-python-reset-instance-dashboard.png)

```JSON
[{"id":"79e751dd.c8402","type":"function","z":"5480b2f5a22f3525","name":"make reset command","func":"var newMsg = {};\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":660,"y":220,"wires":[["7cb11da0.1916bc"]]},{"id":"7cb11da0.1916bc","type":"ctrlx-datalayer-request","z":"5480b2f5a22f3525","device":"7b877229.678964","method":"CREATE","path":"script/instances/MyInstance/cmd/reset","payloadFormat":"value_type","name":"Reset \"MyInstance\"","x":900,"y":220,"wires":[[]]},{"id":"a11e7b1a.b3a8d","type":"ui_button","z":"5480b2f5a22f3525","name":"","group":"f675e9d2.c9935","order":3,"width":"3","height":"1","passthru":false,"label":"Reset instance","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":420,"y":220,"wires":[["79e751dd.c8402"]]},{"id":"690b0e68.ffc46","type":"inject","z":"5480b2f5a22f3525","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":420,"y":260,"wires":[["79e751dd.c8402"]]},{"id":"dc3e7b2.6ab9388","type":"comment","z":"5480b2f5a22f3525","name":"Example: Reset interpreter instance \"MyInstance\"","info":"","x":500,"y":180,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Execute a python command in an interpreter instance "MyInstance"

The following example shows how to execute a python command script in a script interpreter instance `MyInstance`. The corresponding instance has to be present and in state `INIT` or `READY` ([see instance state machine](https://docs.automation.boschrexroth.com/doc/2359488747/user-interface-via-data-layer/latest/en/)).

![example-interpreter-python-execute-command.png](./images/example-interpreter-python-execute-command.png)
![example-interpreter-python-execute-command-dashboard.png](./images/example-interpreter-python-execute-command-dashboard.png)

```JSON
[{"id":"e414e92c.da574","type":"function","z":"4ff80d56.dd60fc","name":"make execute command","func":"var newMsg = {};\nnewMsg.payload = {\n  \"type\":\"object\",\n  \"value\":{\n    \"name\": \"import time; time.sleep(25)\",\n    \"param\": []\n  }\n}\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":450,"y":2160,"wires":[["e0470a61.af156"]]},{"id":"1ca4bac8.ef2ea5","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":200,"y":2200,"wires":[["e414e92c.da574"]]},{"id":"e0470a61.af156","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"script/instances/MyInstance/cmd/string","payloadFormat":"value_type","name":"Execute Command","x":690,"y":2160,"wires":[[]]},{"id":"4f058c35.13bd84","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Execute a python command in an interpreter instance \"MyInstance\"","info":"","x":320,"y":2120,"wires":[]},{"id":"a4823a8f.8706a8","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"f675e9d2.c9935","order":1,"width":"3","height":"1","passthru":false,"label":"Execute command","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":190,"y":2160,"wires":[["e414e92c.da574"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Execute a python file "test.py" in an interpreter instance "MyInstance"

The following example shows how to execute a python script file in a script interpreter instance `MyInstance`. The corresponding instance has to be present and in state `INIT` or `READY` ([see instance state machine](https://docs.automation.boschrexroth.com/doc/2359488747/user-interface-via-data-layer/latest/en/)). The file `test.py` has to be present in the root folder of the active configuration.

Content of `test.py`:

```python
import time
while True:
    time.sleep(1)
    pass
```

![example-interpreter-python-execute-file.png](./images/example-interpreter-python-execute-file.png)
![example-interpreter-python-execute-file-dashboard.png](./images/example-interpreter-python-execute-file-dashboard.png)

```JSON
[{"id":"9df4d3fd.3d9218","type":"function","z":"4ff80d56.dd60fc","name":"make file execute command","func":"var newMsg = {};\nnewMsg.payload = {\n    \"type\":\"object\",\n    \"value\":{\n        \"name\":\"activeConfiguration/test.py\" //File test.py expected at root of the active configuration\n        }\n    }\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":440,"y":2320,"wires":[["374d357d.cb126a"]]},{"id":"d4d2cc18.9e9c1","type":"inject","z":"4ff80d56.dd60fc","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":180,"y":2360,"wires":[["9df4d3fd.3d9218"]]},{"id":"374d357d.cb126a","type":"ctrlx-datalayer-request","z":"4ff80d56.dd60fc","device":"7b877229.678964","method":"CREATE","path":"script/instances/MyInstance/cmd/file","payloadFormat":"value_type","name":"Execute File \"test.py\"","x":700,"y":2320,"wires":[[]]},{"id":"c0963556.392e7","type":"comment","z":"4ff80d56.dd60fc","name":"Example: Execute a python file \"test.py\" in an interpreter instance \"MyInstance\"","info":"","x":320,"y":2280,"wires":[]},{"id":"9df3a70d.0d6f68","type":"ui_button","z":"4ff80d56.dd60fc","name":"","group":"f675e9d2.c9935","order":1,"width":"3","height":"1","passthru":false,"label":"Execute file","tooltip":"","color":"","bgcolor":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":190,"y":2320,"wires":[["9df4d3fd.3d9218"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

### Abort an interpreter instance "MyInstance"

The following example shows how to abort a running script or command in a script interpreter instance `MyInstance`. The corresponding instance has to be present and in state `BUSY` ([see instance state machine](https://docs.automation.boschrexroth.com/doc/2359488747/user-interface-via-data-layer/latest/en/)).

![example-interpreter-python-abort-instance.png](./images/example-interpreter-python-abort-instance.png)
![example-interpreter-python-abort-instance-dashboard.png](./images/example-interpreter-python-abort-instance-dashboard.png)

```JSON
[{"id":"0f30727715f9f47e","type":"function","z":"244b5a539daa7df9","name":"make abort command","func":"var newMsg = {};\nreturn newMsg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":360,"y":1220,"wires":[["73c8c291c5af4037"]]},{"id":"73c8c291c5af4037","type":"ctrlx-datalayer-request","z":"244b5a539daa7df9","device":"7b877229.678964","method":"CREATE","path":"script/instances/MyInstance/cmd/abort","payloadFormat":"value_type","name":"Abort \"MyInstance\"","x":590,"y":1220,"wires":[[]]},{"id":"0ff7dae9e392de65","type":"ui_button","z":"244b5a539daa7df9","name":"","group":"f675e9d2.c9935","order":1,"width":"3","height":"1","passthru":false,"label":"Abort instance","tooltip":"","color":"","bgcolor":"","className":"","icon":"","payload":"","payloadType":"str","topic":"topic","topicType":"msg","x":120,"y":1220,"wires":[["0f30727715f9f47e"]]},{"id":"9b7ad38852b20c26","type":"inject","z":"244b5a539daa7df9","name":"Manual Trigger","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":120,"y":1260,"wires":[["0f30727715f9f47e"]]},{"id":"5048f7d0ef2fe811","type":"comment","z":"244b5a539daa7df9","name":"Example: Abort interpreter instance \"MyInstance\"","info":"","x":200,"y":1180,"wires":[]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"f675e9d2.c9935","type":"ui_group","name":"Interpreter handling","tab":"9cba2148.8c9148","order":4,"disp":true,"width":"4","collapse":false},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```

## ctrlX CORE - EtherCat Master App dashboard examples

Please note that for these examples the installation of the `ctrlX CORE - EtherCat Master App` is expected. See [our store](https://developer.community.boschrexroth.com/t5/Store-and-How-to/ctrlX-CORE-EtherCAT-Master-App/ba-p/13282) and the corresponding [documentation of the EtherCat Master App](https://docs.automation.boschrexroth.com/doc/3229083526/ethercat-master-app-ethercat-master-for-ctrlx-core-application-manual/latest/en/).

### Monitor and switch state of an EtherCat master instance `ethercatmaster`

The following example shows how to monitor and switch the state of an EtherCat master instance `ethercatmaster` ([see EtherCat state machine](https://docs.automation.boschrexroth.com/doc/2260062686/state-machine/latest/en/)). The corresponding instance has to be present .

![example-ethercat-monitor-switch-state.png](./images/example-ethercat-monitor-switch-state.png)
![example-ethercat-monitor-switch-state-dashboard.png](./images/example-ethercat-monitor-switch-state-dashboard.png)

```JSON
[{"id":"ffc99584.58bbd","type":"comment","z":"244b5a539daa7df9","name":"Example: Monitor and switch EtherCat state","info":"","x":190,"y":380,"wires":[]},{"id":"cac2d7f4.22c55","type":"ctrlx-datalayer-request","z":"244b5a539daa7df9","device":"7b877229.678964","method":"WRITE","path":"fieldbuses/ethercat/master/instances/ethercatmaster/admin/fieldbus_status/master_state","payloadFormat":"value_type","name":"Switch EtherCat state","x":700,"y":440,"wires":[[]]},{"id":"3f74d73d.b1514","type":"ctrlx-datalayer-subscribe","z":"244b5a539daa7df9","subscription":"632bcc2.eddf134","path":"fieldbuses/ethercat/master/instances/ethercatmaster/admin/fieldbus_status/master_state","name":"Read EtherCat state","x":110,"y":440,"wires":[["9c708078.0c74f","f9f42567c8a7a1fa"]]},{"id":"9c708078.0c74f","type":"ui_text","z":"244b5a539daa7df9","group":"c686d3e8294c5a12","order":2,"width":"3","height":"1","name":"","label":"EtherCat state","format":"{{msg.payload.response.currentState}}","layout":"row-spread","className":"","x":340,"y":500,"wires":[]},{"id":"f9f42567c8a7a1fa","type":"ui_dropdown","z":"244b5a539daa7df9","name":"Switch state to","label":"","tooltip":"","place":"Switch state to","group":"c686d3e8294c5a12","order":1,"width":"3","height":"1","passthru":false,"multiple":false,"options":[{"label":"OP","value":"{\"type\": \"object\", \"value\": {\"request\": {\"newState\": \"op\"}}}","type":"str"},{"label":"Safe-OP","value":"{\"type\": \"object\", \"value\": {\"request\": {\"newState\": \"safeop\"}}}","type":"str"},{"label":"Pre-OP","value":"{\"type\": \"object\", \"value\": {\"request\": {\"newState\": \"preop\"}}}","type":"str"},{"label":"Init","value":"{\"type\": \"object\", \"value\": {\"request\": {\"newState\": \"init\"}}}","type":"str"}],"payload":"","topic":"topic","topicType":"msg","className":"","x":340,"y":440,"wires":[["65ab8f57b581cc7b"]]},{"id":"65ab8f57b581cc7b","type":"json","z":"244b5a539daa7df9","name":"","property":"payload","action":"obj","pretty":false,"x":510,"y":440,"wires":[["cac2d7f4.22c55"]]},{"id":"7b877229.678964","type":"ctrlx-config","name":"localhost","hostname":"localhost","debug":false},{"id":"632bcc2.eddf134","type":"ctrlx-config-subscription","device":"7b877229.678964","name":"Sub_Default","publishIntervalMs":""},{"id":"c686d3e8294c5a12","type":"ui_group","name":"EtherCat","tab":"9cba2148.8c9148","order":3,"disp":true,"width":"6","collapse":false,"className":""},{"id":"9cba2148.8c9148","type":"ui_tab","name":"Examples","icon":"dashboard","order":7,"disabled":false,"hidden":false}]
```
