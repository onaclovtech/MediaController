/*
 * MediaController v0.0.1
 */
// Now if you look at FB_URL you'll see a new entry with Local and IP address
// Next we'll do an SSDP search and find any "interesting" devices (particularly your chromecast or roku devices).
// Needs cleanup but this reports those devices
//https://www.firebase.com/docs/web/quickstart.html


// This also needs a little work, we don't have a server included in this file, we have to kick off our own running server.
// I mainly wanted this out here in the event I have a system failure, I have it backed up somewhere somehow.
chromecastjs = require('chromecast-js')
var FB_URL = '';
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
devices = [];
var browser = new chromecastjs.Browser()
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

devices.push(myRootRef.push({
    "type": "local",
    "ip": addresses[0]
}));

browser.on('deviceOn', function(device){
  device.connect()
  device.on('connected', function(){
devices.push(myRootRef.push({
            "type": "chromecast",
            "state": "waiting"
        }));
//http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4
   // Put logic here for state changes
myRootRef.on('child_changed', function(childSnapshot, prevChildName) {
// code to handle child data changes.
var data = childSnapshot.val();
var localref = childSnapshot.ref();
if (data["state"] == "play")
{
device.play(data["movie"], 60, function(){
        console.log('Playing in your chromecast!')
    });
}
})
  })
})
