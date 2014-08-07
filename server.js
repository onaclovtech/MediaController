/*
* MediaController v0.0.1
*/
var connect = require('connect'),
http = require('http');
connect()
.use(connect.static('path you wish to serve'))
.use(connect.directory('path you wish to serve'))
.listen(80); // I use 80 on my local network, you could use 8080


var FB_URL = "";
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var ip = ""; // I'll set this up to find it by itself in the near future.
myRootRef.push({"type" : "local", "ip" : ip});

// Now if you look at FB_URL you'll see a new entry with Local and IP address
// Next we'll do an SSDP search and find any "interesting" devices (particularly your chromecast or roku devices.
// Coming soon
