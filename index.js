var express = require('express');
var io = require('socket.io');
var argv = require('minimist')(process.argv.slice(2));
var port = argv.port || 8080;

var app = require('express')();
var serveIndex = require('serve-index')

var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var appRoot = require('path').dirname(require.main.filename);
console.log(appRoot);

//file stream
var logfileWriter = null;

function appendToLog(event) {
  if (logfileWriter == null) {

    if (!fs.existsSync("./logs")) {
      fs.mkdirSync("./logs");
    }
    var dataDirectory = "./logs/nst" + Date.now();
    fs.mkdirSync(dataDirectory);
    logfileWriter = fs.createWriteStream(dataDirectory + "/nst-events.ldjson", { flags: 'a' });
  }

  if (logfileWriter != null) {
    var data = JSON.stringify(event) + '\n';
    logfileWriter.write(data);
  }
}


//status for admin console
var lastStatusUpdateTime = 0;
var status = {
  clientsCount: io.engine.clientsCount,
  sensors: {}
};

function updateStatus(sensorEvent, serverTimeMs) {
  if (sensorEvent != null) {
    if (!status.sensors.hasOwnProperty(sensorEvent.id)) {
      status.sensors[sensorEvent.id] = {
        serverTimeMs: serverTimeMs
      }
      io.emit('status', status);
    }
    status.sensors[sensorEvent.id].serverTimeMs = serverTimeMs;
  }

  status.clientsCount = io.engine.clientsCount;


  //check for disconnected sensors
  for (const key in status.sensors) {
    if (status.sensors.hasOwnProperty(key)) {
      const element = status.sensors[key];
      if (Date.now() - element.serverTimeMs > 1e3) {
        delete status.sensors[key];
      }
    }
  }

  if (Date.now() - lastStatusUpdateTime > 1e3) {
    lastStatusUpdateTime = Date.now();
    io.emit('status', status);
  }
}

setInterval(() => {
  updateStatus(null, Date.now());
}, 1000);

app.use(express.static(appRoot+'/public'));
app.use('/logs', express.static('logs'), serveIndex('logs', { 'icons': false }))


app.get('/', function (req, res) {
  res.sendFile(appRoot+'/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected - clientsCount = ' + io.engine.clientsCount);

  socket.on('sensor', function (message) {
    var serverTimeMs = Date.now();
    updateStatus(message, serverTimeMs);
    message.serverTimeMs = serverTimeMs;
    appendToLog(message);
    io.emit('sensor', message);
  });
  socket.on('restart-log', function (message) {
    console.log('restart-log');
    logfileWriter = null;
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});

http.listen(port, function () {
  console.log('listening on *:' + port);
});