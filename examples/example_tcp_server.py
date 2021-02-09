import socket
import sys
import time
import json
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server_address = ('localhost', 1337)
print('starting up on %s port %s' % server_address)
sock.bind(server_address)

# Listen for incoming connections
sock.listen(1)

while True:
    # Wait for a connection
    print('waiting for a connection')
    connection, client_address = sock.accept()

    try:
        print('connection from', client_address)

        # Receive the data in small chunks and retransmit it
        for value in range(1, 100):            
            connection.sendall(json.dumps(
                {'timestamp': int(time.time()), 'id': 'wheel', 'values': [value]}).encode())
            time.sleep(0.1)

    finally:
        # Clean up the connection
        connection.close()
