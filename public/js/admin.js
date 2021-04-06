var socket = io("");

socket.on("connect", function (socket) {
  console.log("connected");
});

let previousMessage = {};
socket.on("status", function (message) {
  if (message.sensors != null) {
    viewModel.sensor.removeAll();
    for (const key in message.sensors) {
      if (message.sensors.hasOwnProperty(key)) {
        const element = message.sensors[key];
        element.id = key;
        viewModel.sensor.push(element);
      }
    }
  }
  if (message.clientsCount != null) {
    viewModel.clientsCount(message.clientsCount);
  }
  if (
    previousMessage.clientsCount != message.clientsCount ||
    previousMessage.sensors.length != message.sensors.length
  ) {
    console.log(message);
  }
  previousMessage = message;
});

document.getElementById("restart-log-button").onclick = (ev) => {
  socket.emit("restart-log");
};

document.getElementById("load-algorithm").onchange = (ev) => {
  console.log(ev);
  const algorithmJs = ev.currentTarget.files[0];
  console.log(algorithmJs);
  socket.emit("loadAlgorithm", { name: algorithmJs.name, data: algorithmJs });

  // file picker then send js file over websocket
};

let map;
let mapCenterPref = window.localStorage.getItem("mapCenter");
let mapZoomPref = window.localStorage.getItem("mapZoom");

if (null === mapCenterPref || '{"lat":null,"lng":null}' == mapCenterPref) {
  mapCenterPref = '{"lat":38.45309648354833,"lng":-122.71671188072128}';
} else {
  console.log("using location:" + mapCenterPref);
}
if (null == mapZoomPref || isNaN(Number(mapZoomPref))) {
  mapZoomPref = "19";
} else {
  console.log("using zoom:" + mapZoomPref);
}
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: JSON.parse(mapZoomPref),
    center: JSON.parse(mapCenterPref),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  });

  map.addListener("center_changed", function () {
    window.localStorage.setItem("mapCenter", JSON.stringify(map.getCenter()));
    window.localStorage.setItem("mapZoom", JSON.stringify(map.getZoom()));
  });
  map.addListener("zoom_changed", function () {
    window.localStorage.setItem("mapZoom", JSON.stringify(map.getZoom()));
  });
}

//knockout for reactive list
var viewModel = {
  sensor: ko.observableArray([]),
  clientsCount: ko.observable(0),
};

ko.applyBindings(viewModel);
