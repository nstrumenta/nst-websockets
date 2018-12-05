# nst-websockets
websocket server and file logger

## Installation

```bash
npm install -g nst-websockets
```

## How to use

### Start the server
Once installed locally, run nst-websockets from the command line with optional port parameter (default is 8080)

```bash
nst-websockets --port 8080
```
Opening localhost:8080 in the browser will display the minimal admin panel that shows the number of connected socket clients (the browser tab is a client):

![Alt text](screenshots/admin.png?raw=true "browser screenshot")


Any messages received will be logged to a local file such as:

```bash
logs/nst1536704358009/nst-events.ldjson
```

the folder name is generated from the start time.  Each log entry will also be timestamped with the server time.

### Tcp Client

#### Configuration

local file ```nst-websockets-config.json``` is used to configure the websocket server as a TCP client to specified TCP servers

```json
{
  "tcpServers": [
    {
      "port": "1337",
      "address": "0.0.0.0"
    }
  ]
}
```


### Sending to the server from your socket.io client

Connect to the server with a socket.io client:
https://socket.io/

There is a java client here:
https://github.com/socketio/socket.io-client-java

For every log entry, send a ```'sensor'``` event to the server with a json object containing and id, comName, and a data object containing the contents of the entry, this can be any format, but ideally would include a sensor timestamp and values.
```javascript
io.emit('sensor', 
{ "id":"trax",
  "comName":"/dev/cu.usbserial-DO01OHP2",
  "data": {
    "traxTimestamp":51397,
    "acc":[-156,568,16346],
    "mag":[752,1005,2598],
    "gyro":[-28,-9,-6]
  });
```



