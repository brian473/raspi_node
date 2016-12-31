var dgram = require('dgram');

var name = "kitchen lamp";
var id = "ECO-78019161";
var host = "192.168.1.222";
var port = 80;

var plugs = [];

plugs.push({
	name: "kitchen lamp",
	id: "ECO-78019161",
	host: "192.168.1.222",
	port: 80
});

var bufferLength = 130;
var command1 = 0x16000500;
var command2 = 0x0200;
var new_state = 0x0101;


var createMessage = function(plug) {
var buffer = new Buffer(bufferLength);
buffer.fill(0);

// Byte 0:3 - Command 0x16000500 = Write, 0x17000500 = Read
    buffer.writeUInt32BE(command1, 0);
    
    // Byte 4:7 - Command sequence num - looks random
    buffer.writeUInt32BE(Math.floor(Math.random() * 0xFFFF), 4);

    // Byte 8:9 - Not sure what this field is - 0x0200 = Write, 0x0000 = Read
    buffer.writeUInt16BE(command2, 8);

    // Byte 10:14 - ASCII encoded FW Version - Set in readback only?
    
    // Byte 15 - Always 0x0
    
    // Byte 16:31 - ECO Plugs ID ASCII Encoded - <ECO-xxxxxxxx>
    buffer.write(plug.id, 16, 16);

    // Byte 32:47 - 0's - Possibly extension of Plug ID
    
    // Byte 48:79 - ECO Plugs name as set in app
    
    // Byte 80:95 - ECO Plugs ID without the 'ECO-' prefix - ASCII Encoded
    
    // Byte 96:111 - 0's
    
    // Byte 112:115 - Something gets returned here during readback - not sure
    
    // Byte 116:119 - The current epoch time in Little Endian
    buffer.writeUInt32LE((Math.floor(new Date() / 1000)), 116);
    
    // Byte 120:123 - 0's
    
    // Byte 124:127 - Not sure what this field is - this value works, but i've seen others 0xCDB8422A
    buffer.writeUInt32BE(0xCDB8422A, 124);
    
    // Byte 128:129 - Power state (only for writes)
    if (buffer.length == 130) {
        buffer.writeUInt16BE(new_state, 128);
    }

    return buffer;
}

var message = createMessage(plugs[0]);

var sendMessage = function(message, thisPlug, retry_count) {

    var socket = dgram.createSocket('udp4');
    var timeout;

    socket.on('message', function (message) {
        clearTimeout(timeout);
        socket.close();
    }.bind(this));

    socket.send(message, 0, message.length, thisPlug.port, thisPlug.host, function (err, bytes) {
        if (err) {
            console.log(err);
        } else {
            timeout = setTimeout(function () {
                socket.close();
                if (retry_count > 0) {
                    console.log("Timeout connecting - Retrying....");
                    var cnt = retry_count - 1;
                    sendMessage(message, thisPlug, cnt);
                } else {
                    console.log("Timeout connecting - Failing");
                }
            }.bind(this), 500);
        }
    }.bind(this));
}

sendMessage(message, plugs[0], 3);
