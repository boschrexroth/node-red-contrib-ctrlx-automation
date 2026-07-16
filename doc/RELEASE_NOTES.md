
# Version 1.9.10

In case of an error, the human readable `error.message` attribute now contains additional information about the error instead of showing only the error title.
The message is formatted as JSON for improved readability.

When using a catch node, you can find the message in `msg.error.message`. See also the official Node-RED documentation at https://nodered.org/docs/user-guide/handling-errors.

<img src="./images/release-notes-error-handling.png" alt="Error Handling" width="600px"/>


# Version 1.9.9

The `Sampling Interval` of a subscription can now be set to `0`, which means, that the ctrlX Data Layer will sample the value at the fastest possible interval. When using
this setting on realtime variables of the ctrlX Data Layer it is possible to sample the signal lossless without missing a value change. ctrlX Data Layer variables which support
lossless sampling are also tagged with `qos.lossless: true` in the metadata and shown in the ctrlX Data Layer editor of the ctrlX OS user interface.

Using lossless sampling on the EtherCAT process data, it is for example possible to get the process value from exactly every fieldbus cycle. There will be no sample anomalies
from missing a cycle or sampling the same value from a cycle twice.

Note: Keep in mind to also chose a `Queue Length` that is large enough to hold all samples for the given `Publish Interval`.

# Version 1.9.0

Version 1.9.0 includes a lot of new features and some changes which are listed below.

## New Subscription options

The subscription dialog features a lot of new options to set the behaviour of the subscription.

<img src="./images/node-settings-config-subscription.png" alt="Configuration node settings" width="400px"/>

For example, the `Sampling Interval` allows to sample the value on the server side with a higher frequency.
A detailed explanation of all settings is available in the [Reference](REFERENCE.md).

## Limits for number of active requests

The request node has 2 new properties:

<img src="./images/node-settings-dl-request-limits.png" alt="Data Layer Request node settings" width="400px"/>

These limits can be used to prevent, that the flow gets unstable when the rate at which requests are sent from the flow
is constantly higher than the rate at which these can be processed on server side. To do so, all further request get dropped as long as the number of
active requests (i.e. pending responses) is higher than the `Error` limit. This case can also be catched by the `catch` node.
When the number of active requests reaches the `Warning` limit only a warning message will be logged.

## Dynamic subscriptions

The subscription node now has a "dynamic" mode which allows the path to be dynamically set and changed at runtime instead of being
fixed at the time of deployment of the flow.
After setting the node to `dynamic`, the node gets an input connector which accepts the following `msg` to subscribe to a data layer path:

```javascript
msg = {
    "action": "subscribe",
    "path": "<path to subscribe>"
}
```

Or to unsubscribe from the current data layer path:

```javascript
msg = {
    "action": "unsubscribe"
}
```

## Multiple paths per subscription node

Using the dynamic subscription features it is now also possible to subscribe to more than a single ctrlX Data Layer path with a single Node-RED subscription node.
This can be done by passing an array of addresses for the `path`.

```javascript
msg = {
    "action": "subscribe",
    "path": ["<path to subscribe>", "<path to subscribe>", "<path to subscribe>", "..."]
}
```

## Default payload format of Request-Node now 'value + type'

Up to this version, the default format for the payload of the Request-Node was `value only`. This is now changed to `value + type`, because the
payload format was not very intuitive. Especially for write-requests where most of the provider require the type of the value to be given explicitly.
The new default setting will only be applied for new nodes which are added to the flow. Nodes in existing flows keep the settings.
On this occassion, the deprecated payload format `v1` is removed and no longer available.
