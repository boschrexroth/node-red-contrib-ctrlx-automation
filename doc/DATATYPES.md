# Data Layer Data Types

The following table shows the data types of the ctrlX Data Layer and the mapping to Node-RED (javascript) as well as to the types of the IEC61131-3 programming language of the PLC app.

| Data Layer | Javascript | IEC61131-3 |
| --- | --- | --- |
| `bool8`     | `boolean`                      | `BOOLEAN`, `BIT`  |
| `int8`      | `number`                       | `SINT`            |
| `uint8`     | `number`                       | `USINT`, `BYTE`   |
| `int16`     | `number`                       | `INT`             |
| `uint16`    | `number`                       | `UINT`, `WORD`    |
| `int32`     | `number`                       | `DINT`            |
| `uint32`    | `number`                       | `UDINT`, `DWORD`  |
| `int64`     | `BigInt`                       | `LINT`            |
| `uint64`    | `BigInt`                       | `ULINT`, `LWORD`  |
| `float`     | `number`                       | `REAL`            |
| `double`    | `number`                       | `LREAL`           |
| `string`    | `String`                       | `STRING`          |
| `arbool8`   | `object` (`Array` of `number`) | `ARRAY OF BOOLEAN`, `ARRAY OF BIT` |
| `arint8`    | `object` (`Array` of `number`) | `ARRAY OF SINT`                    |
| `aruint8`   | `object` (`Array` of `number`) | `ARRAY OF USINT`, `ARRAY OF BYTE`  |
| `arint16`   | `object` (`Array` of `number`) | `ARRAY OF INT`                     |
| `aruint16`  | `object` (`Array` of `number`) | `ARRAY OF UINT`, `ARRAY OF WORD`   |
| `arint32`   | `object` (`Array` of `number`) | `ARRAY OF DINT`                    |
| `aruint32`  | `object` (`Array` of `number`) | `ARRAY OF UDINT`, `ARRAY OF DWORD` |
| `arint64`   | `object` (`Array` of `BigInt`) | `ARRAY OF LINT`                    |
| `aruint64`  | `object` (`Array` of `BigInt`) | `ARRAY OF ULINT`, `ARRAY OF LWORD` |
| `arfloat`   | `object` (`Array` of `number`) | `ARRAY OF REAL`                    |
| `ardouble`  | `object` (`Array` of `number`) | `ARRAY OF LREAL`                   |
| `arstring`  | `object` (`Array` of `string`) | `ARRAY OF STRING`                  |
| `object`    | `object`                       | via library |

The first column is the datatype which is used for the attribute `type` in the `msg.payload` when reading or writing Data Layer Requests with the property of the payload format set to `value + type (json)`.

For example, a `READ` request to the path `framework/metrics/system/cpu-utilisation-percent` might return the following json in `msg.payload`:

  ```JSON
  {
    "value": 17.5,
    "type": "double"
  }
  ```
