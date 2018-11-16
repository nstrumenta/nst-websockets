
var socket = io('');


socket.on('connect', function (socket) {
    console.log('connected');
});


socket.on('status', function (message) {
    if(message.sensors!=null){
        viewModel.sensor.removeAll();
        for (const key in message.sensors) {
            if (message.sensors.hasOwnProperty(key)) {
                const element = message.sensors[key];
                element.id = key;
                viewModel.sensor.push(element);
            }
        }
    }
    if(message.clientsCount != null){
        viewModel.clientsCount(message.clientsCount);
    }

    console.log(message);
});

document.getElementById("restart-log-button").addEventListener("click",(ev)=>{
    socket.emit('restart-log');
})

//knockout for reactive list
var viewModel = {
    sensor: ko.observableArray([]),
    clientsCount: ko.observable(0)
};
 
ko.applyBindings(viewModel);