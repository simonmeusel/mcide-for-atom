import sys, ssl, socket

print(sys.argv[0])
address = sys.argv[1]
port = sys.argv[2]
data = sys.argv[3]

print(address + ":" + port);
print(data);

context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
context.verify_mode = ssl.CERT_NONE

client = context.wrap_socket(socket.socket(socket.AF_INET))
client.connect((address, int(port)))
client.sendall(bytes(data + "\n\n------***endofsequence***-------" ))
client.close()
