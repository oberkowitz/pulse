'use strict'
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())
var idMapperService = require('./services/idMapperService.js')();

var routes = require('./routes/router.js')(app, idMapperService);

var midiSerialService;
var initialPromises = [];
initialPromises.push(idMapperService.getMappings());
var midiMapPromise = new Promise((resolve, reject) => {
  fs.readFile('midiMap.json', (err, data) => {
    if (err) reject(err);
    else {
      var json = JSON.parse(data);
      resolve(json);
    }
  });
});
initialPromises.push(midiMapPromise)
Promise.all(initialPromises).then(
  (dataArr) => {
    midiSerialService = require("./services/midiSerialService.js")(dataArr[0], dataArr[1]);
    idMapperService.addListener(midiSerialService);
   },
  (err) => { process.exit(err); }
);

app.listen(3000, function () {
    console.log("Listening on port 3000");
});

// Terminate process
process.on('SIGINT', function() {
    midiSerialService.shutdown();
    process.exit();
});
