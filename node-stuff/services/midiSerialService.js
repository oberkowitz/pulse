var midi = require("midi");
var SerialPort = require("serialport");
var prompt = require("prompt");
var config = require("../config.js");
var FAKE_SERIAL = config.FAKE_SERIAL;
var USBSERIAL = config.USBSERIAL;
var fs = require("fs");

module.exports = (solenoidToRelayMap, midiMap)=> {
  //Configure serial device
  var ser;
  // FAKE_SERIAL = tr;
  if (FAKE_SERIAL) {
    ser = {
      write : function(string, callback) {
        console.log(string);
        if (callback) callback();
      },
      drain : function(callback) {
        if (callback) callback();
      }
    };
  } else {
    var serialProps = {
      baudRate: 19200
    };
    ser = new SerialPort(USBSERIAL, serialProps, function (err) {
      if (err) {
        console.log('Error: ', err.message);
        process.exit()
      }
      initMidi();
    });
  }

  function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  }

  var sendSignal = function(solenoidId, onOff) {
    var relayAddress = solenoidToRelayMap[solenoidId];
    if (relayAddress) {
      var command = "!" + relayAddress + onOff + ".";
      console.log("Writing command: " + command);
      ser.write(command, function(err) {
        if (err) {
          console.log('Error: ', err);
          return;
        }
      });
    }
  }

  var buildCommand = function(note, onOff) {
    // var sol = note+1;
    var sol = midiMap[note];
    sendSignal(sol, onOff);
  }

  // Configure Midi Input
  var input = new midi.input();
  var portCount = input.getPortCount();
  for (var i = 0; i < portCount; i++){
    console.log("Input device " + i + ":" + input.getPortName(i));
  }

  this.handleMidiMessage = function(deltaTime, message) {
    console.log('m:' + message + ' d:' + deltaTime);
    var status = message[0] & 0xf0;
    if (status == 0x90) {
      var note = message[1];
      var velocity = message[2];
      if (velocity == 0) {
        buildCommand(note, 0);// note on with velocity 0 is a note off
      } else {
        buildCommand(note, 1); // note on
      }
    } else if (status == 0x80) {
      var note = message[1];
      buildCommand(note, 0);
    }
  }
  input.on('message', this.handleMidiMessage);

  var initMidi = () => {
    var inputId = config.INPUT_ID;
    console.log('Selected input device: ' + input.getPortName(inputId));
    input.openPort(inputId);
  }

  this.mappingsUpdated = (newMap) => {
    map = newMap;
  }

  this.shutdown = () => {
    console.log("MidiSerialService shutdown");
    if (input && input.closePort) input.closePort();
  }

  return this;
}
