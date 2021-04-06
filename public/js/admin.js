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

socket.on("sensor", (event) => {
  renderEvent(event);
});

socket.on("outputEvent", (event) => {
  renderEvent(event);
});

document.getElementById("restart-log-button").onclick = (ev) => {
  clearPolylines();
  socket.emit("restart-log");
};
document.getElementById("center-map-button").onclick = centerMap;

document.getElementById("load-algorithm").onchange = (ev) => {
  console.log(ev);
  const algorithmJs = ev.currentTarget.files[0];
  console.log(algorithmJs);
  socket.emit("loadAlgorithm", { name: algorithmJs.name, data: algorithmJs });

  // file picker then send js file over websocket
};

document.getElementById("load-parameters").onchange = (ev) => {
  console.log(ev);
  try {
    console.log(ev.currentTarget.files[0]);
    const reader = new FileReader();
    reader.onload = () => {
      const nstProject = JSON.parse(reader.result);
      console.log(nstProject);
      socket.emit("loadParameters", nstProject.parameters);
    };
    reader.readAsText(ev.currentTarget.files[0]);
  } catch (e) {
    console.error(e);
  }
};

// begin map
polylines = [];
renderEvent = (event) => {
  switch (event.id) {
    case 1008:
      const magLatLng = new google.maps.LatLng(
        event.values[0],
        event.values[1]
      );
      addToPolyline("fused-mag", "green", magLatLng);
      break;
    case 1009:
      const gyroLatLng = new google.maps.LatLng(
        event.values[0],
        event.values[1]
      );
      addToPolyline("fused-gyro", "purple", gyroLatLng);
      break;
    case 1011:
      const vdrLatLng = new google.maps.LatLng(
        event.values[0],
        event.values[1]
      );
      addToPolyline("fused-vdr", "blue", vdrLatLng);
      break;
    case 65666:
      const gpsOutputLatLng = new google.maps.LatLng(
        event.values[0],
        event.values[1]
      );
      addToPolyline("gps-output", "red", gpsOutputLatLng);
      break;
    case "GPS":
      const gpsLatLng = new google.maps.LatLng(event.latitude, event.longitude);
      addToPolyline("gps", "red", gpsLatLng);
      break;
  }
};

function clearPolylines(matchingPrefix) {
  for (var key in polylines) {
    if (polylines.hasOwnProperty(key)) {
      let isMatch = false;
      if (matchingPrefix && key.startsWith(matchingPrefix)) {
        isMatch = true;
      }
      if (isMatch || matchingPrefix == null) {
        polylines[key].setMap(null);
        delete polylines[key];
      }
    }
  }
}

function centerMap() {
  var bounds = new google.maps.LatLngBounds();
  for (var key in polylines) {
    if (polylines.hasOwnProperty(key)) {
      for (var index in polylines[key].getPath().getArray()) {
        bounds.extend(polylines[key].getPath().getArray()[index]);
      }
    }
  }
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds);
  }
}

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

function addToPolyline(id, color, latLng) {
  if (!polylines.hasOwnProperty(id)) {
    console.log("new polyline: " + id);
    polylines[id] = new google.maps.Polyline({
      clickable: false,
      strokeColor: color,
      strokeOpacity: 0.5,
      strokeWeight: 5,
      map: map,
    });
  }
  var path = polylines[id].getPath();
  path.push(latLng);
  if (path.length > 50000) {
    path.removeAt(0);
  }
}

//end map

//knockout for reactive list
var viewModel = {
  sensor: ko.observableArray([]),
  clientsCount: ko.observable(0),
};

ko.applyBindings(viewModel);
