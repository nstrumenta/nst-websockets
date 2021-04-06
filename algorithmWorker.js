const { parentPort } = require("worker_threads");

var Module = {};

function Algorithm() {
  let nstrumenta;
  let parameters;

  restartAlgorithm = () => {
    if (nstrumenta) {
      nstrumenta.init();
      if (parameters) {
        //TODO relying on order of parameters is easily broken
        // keeping an integer parameter ID as a value in parameters
        // or using a short string as a key
        for (index in parameters) {
          const param = parameters[index];
          nstrumenta.setParameter(Number(index), Number(param.value));
        }
      }
    }
  };

  parentPort.onmessage = function (e) {
    // console.log("message from parent to algorithmworker", e.data.type);
    switch (e.data.type) {
      case "loadAlgorithm":
        console.log("loading Algorithm into worker", e.data);
        const source = Buffer.from(e.data.payload).toString();
        eval(source);
        nstrumenta = new Module.Nstrumenta();
        break;

      case "inputEvent":
        const event = e.data.event;
        // console.log("input event", event);
        //check for NaN values
        let values = [];
        for (i = 0; i < 9; i++) {
          values[i] = event.values[i];
          if (isNaN(values[i]) || values[i] === null) {
            values[i] = 0;
          }
        }
        nstrumenta.reportEvent(
          event.timestamp,
          event.id,
          values.length,
          values[0],
          values[1],
          values[2],
          values[3],
          values[4],
          values[5],
          values[6],
          values[7],
          values[8]
        );

        //special case for GPS - pass through
        if (event.id == 65666) {
          parentPort.postMessage({ type: "outputEvent", event });
        }

        break;

      case "loadParameters":
        parameters = e.data.parameters;
        restartAlgorithm();

      case "restart":
        restartAlgorithm();
        break;
    }
  };
}

algorithmWorker = new Algorithm();

const SensorEvent = function (timestamp, id, values) {
  this.timestamp = timestamp;
  this.id = id;
  this.values = values;
};

const eventFromMsg = function (msg) {
  return new SensorEvent(msg.timestamp, msg.id, msg.values);
};

//this method is called from nstrumenta
function outputEventMsg(msg) {
  const event = eventFromMsg(msg);
  parentPort.postMessage({ type: "outputEvent", event });
}
