var express = require("express");
var io = require("socket.io");
var argv = require("minimist")(process.argv.slice(2));
const FormData = require("form-data");
const axios = require("axios");

var debug = argv.debug ? argv.debug : false;
var port = argv.port || 8080;
var projectId = argv.projectId;

var app = require("express")();
var serveIndex = require("serve-index");

var http = require("http").Server(app);
var io = require("socket.io")(http);
var fs = require("fs");

//config file for tcp clients
var fs = require("fs");
tcpServers = [];
if (fs.existsSync("nst-websockets-config.json")) {
  console.log("nst-websockets-config.json begin:");
  var config = JSON.parse(
    fs.readFileSync("nst-websockets-config.json", "utf8")
  );
  config.tcpServers.forEach((element) => {
    console.dir(element);
    tcpServers.push(element);
  });
  console.log("nst-websockets-config.json end");
}

var net = require("net");

tcpServers.forEach(function (tcpServer) {
  var client = new net.Socket();
  var clientId = tcpServer.address + ":" + tcpServer.port;

  client.connect(tcpServer.port, tcpServer.address, function () {
    console.log("Connected to " + clientId);
  });

  client.on("data", function (data) {
    if (debug) {
      console.log(clientId + " " + data.toString());
    }
    var serverTimeMs = Date.now();
    var message = {
      id: clientId,
      data: data.toString(),
    };
    updateStatus(message, serverTimeMs);
    message.serverTimeMs = serverTimeMs;
    appendToLog(message);
    io.emit("sensor", message);
  });

  client.on("close", function () {
    console.log(
      "Connection to " + tcpServer.address + ":" + tcpServer.port + " closed"
    );
  });

  client.on("error", function (err) {
    console.log("error " + err);
  });
});

var appRoot = require("path").dirname(require.main.filename);
console.log(appRoot);

//file stream
var logfileWriter = null;

function appendToLog(event) {
  if (logfileWriter == null) {
    if (!fs.existsSync("./logs")) {
      fs.mkdirSync("./logs");
    }
    const dataDirectory = "./logs/";
    const fileName = `nst${Date.now()}.ldjson`;
    const filePath = dataDirectory + fileName;
    logfileWriter = fs.createWriteStream(filePath, { flags: "a" });
    console.log("starting log", fileName);

    logfileWriter.on("finish", () => {
      console.log(filePath, "write finished");
      if (projectId) {
        console.log(`posting file ${filePath} to projectId ${projectId}`);
        const nstrumentaProjectUrl = `https://us-central1-nstrumenta-dev.cloudfunctions.net/uploadFile?projectId=${projectId}`;

        const form = new FormData();
        form.append("file", fs.readFileSync(filePath), fileName);
        const formHeaders = form.getHeaders();
        const request_config = {
          headers: {
            ...formHeaders,
            "Content-Type": "multipart/form-data",
          },
        };
        axios.post(nstrumentaProjectUrl, form, request_config).catch((err) => {
          console.log(err);
        });
      }
    });
  }
  if (logfileWriter != null) {
    var data = JSON.stringify(event) + "\n";
    logfileWriter.write(data);
  }
}

//status for admin console
var lastStatusUpdateTime = 0;
var status = {
  clientsCount: io.engine.clientsCount,
  sensors: {},
};

function updateStatus(sensorEvent, serverTimeMs) {
  if (sensorEvent != null) {
    if (!status.sensors.hasOwnProperty(sensorEvent.id)) {
      status.sensors[sensorEvent.id] = {
        serverTimeMs: serverTimeMs,
      };
      io.emit("status", status);
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
    io.emit("status", status);
  }
}

setInterval(() => {
  updateStatus(null, Date.now());
}, 1000);

app.use(express.static(appRoot + "/public"));
app.use("/logs", express.static("logs"), serveIndex("logs", { icons: false }));

app.get("/", function (req, res) {
  res.sendFile(appRoot + "/index.html");
});

io.on("connection", function (socket) {
  console.log("a user connected - clientsCount = " + io.engine.clientsCount);

  socket.on("sensor", function (message) {
    var serverTimeMs = Date.now();
    updateStatus(message, serverTimeMs);
    message.serverTimeMs = serverTimeMs;
    appendToLog(message);
    if (debug) {
      console.log(JSON.stringify(message));
    }
    io.emit("sensor", message);
  });
  socket.on("restart-log", function (message) {
    console.log("restart-log");
    if (logfileWriter) {
      logfileWriter.end();
    }
    logfileWriter = null;
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

http.listen(port, function () {
  console.log("listening on *:" + port);
});
