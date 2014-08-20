/*
 * MediaController v0.0.1
 */
// Now if you look at FB_URL you'll see a new entry with Local and IP address
// Next we'll do an SSDP search and find any "interesting" devices (particularly your chromecast or roku devices).
// Needs cleanup but this reports those devices
//https://www.firebase.com/docs/web/quickstart.html


// File Server for the movies
var connect = require('connect'),
    http = require('http');
var path_to_share = ''
connect()
    .use(connect.static(path_to_share))
    .use(connect.directory(path_to_share))
    .listen(80);
console.log("created server");
devices = [];
var FB_URL = '';
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')

var interfaces = os.networkInterfaces();
var addresses = [];
for (k in interfaces) {
    for (k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family == 'IPv4' && !address.internal) {
            addresses.push(address.address)
        }
    }
}

// Pushing local device out there (so if you're in network you can play movies)
devices.push(myRootRef.push({
    "type": "local",
    "ip": addresses[0]
}));

// Roku Discovery Section
var roku_index
var dgram = require('dgram'); // dgram is UDP
// Listen for responses
function listen(port) {
    var server = dgram.createSocket("udp4");
    server.on("message", function(msg, rinfo) {
        devices.push(myRootRef.push({
            "type": "roku",
            "ip": rinfo.address,
            "port": rinfo.port,
            "state": "waiting"
        }));
        console.log("Got the Roku's IP");
    });
    server.bind(port); // Bind to the random port we were given when sending the message, not 1900
    // Give it a while for responses to come in
    setTimeout(function() {
        server.close();
    }, 20000);
}

function search() {
    var message = new Buffer(
        "M-SEARCH * HTTP/1.1\r\n" +
        "Host:239.255.255.250:1900\r\n" +
        "Man:\"ssdp:discover\"\r\n" +
        "ST: roku:ecp\r\n" + // Essential, used by the client to specify what they want to discover, eg 'ST:ge:fridge'
        "MX:2\r\n" + // 1 second to respond (but they all respond immediately?)
        "\r\n"
    );
    var client = dgram.createSocket("udp4");
    client.bind(1900, "239.255.255.250"); // So that we get a port so we can listen before sending
    listen(client.address().port);
    client.send(message, 0, message.length, 1900, "239.255.255.250", function(err, bytes) {
        client.close();
    });
}
search();




/* 
 * roku control
 */
function send_message(options) {
    console.log(options);
    var req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            console.log('BODY: ' + chunk);
        });
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    // write data to request body
    req.write('data\n');
    req.write('data\n');
    req.end();
}

// Letters can/will be added eventually.

var States = ['Home', 'Rev', 'Fwd', 'Play', 'Select', 'Left', 'Right', 'Down', 'Up', 'Back', 'InstantReplay', 'Info', 'Backspace', 'Search', 'Enter'  ]

/*
 * Firebase State Manager
 */
myRootRef.on('child_changed', function(childSnapshot, prevChildName) {
    // code to handle child data changes.
    var data = childSnapshot.val();
    var localref = childSnapshot.ref();
    // Send command to roku below
    if (States.indexOf(data["state"]) >= 0) {
        console.log('Change State to ' + data["state"]);
        send_message({
            hostname: data["ip"],
            port: 8060,
            path: '/keypress/' + data["state"],
            method: 'POST'
        });
        localref.update({
            "state": "waiting"
        });
        console.log("Back to Waiting...");
    }
    

});
console.log("setup on callback");




/*
 * Shutting down stuff
 */
process.stdin.resume(); //so the program will not close instantly
function delete_fb_entries() {
    return function() {
        for (i = 0; i < devices.length; i++) {
            devices[i].remove();
        }
        process.exit()
    }
}

//do something when app is closing
process.on('exit', delete_fb_entries());

//catches ctrl+c event
process.on('SIGINT', delete_fb_entries());

//catches uncaught exceptions
process.on('uncaughtException', delete_fb_entries());
