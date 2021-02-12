import time
import socketio

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')
    for i in range(1, 100):
        sio.emit('sensor', {'foo': i})
        time.sleep(.1)

@sio.event
def my_message(data):
    print('message received with ', data)
    sio.emit('my response', {'response': 'my response'})

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://localhost:8080')