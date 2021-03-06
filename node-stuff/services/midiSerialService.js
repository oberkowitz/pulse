var midi = require("midi");
var SerialPort = require("serialport");
var prompt = require("prompt");
var FAKE_SERIAL = require("../config.js").FAKE_SERIAL;

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
    ser = new SerialPort("/dev/tty.usbserial", serialProps, function (err) {
      if (err) {
        console.log('Error: ', err.message);
        process.exit()
      }
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
      ser.write(command, function(err) {
        if (err) console.log('Error: ', err);
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
  var output = new midi.output();
  var portCount = input.getPortCount();
  for (var i = 0; i < portCount; i++){
    console.log("Input device " + i + ":" + input.getPortName(i));
  }

  portCount = output.getPortCount();
  for (var i = 0; i < portCount; i++){
    console.log("Output device " + i + ":" + output.getPortName(i));
  }

  this.handleMidiMessage = function(deltaTime, message) {
    console.log('m:' + message + ' d:' + deltaTime);
    if (output) {
      output.sendMessage(message);
    }
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

  // Use prompt to define input device
  prompt.start();
  var properties = [
    {
      name: 'inputId',
      validator: /^[0-9]*$/,
      warning: 'inputId must be an integer.'
    },
    {
      name: 'outputId',
      validator: /^[0-9]*$/,
      warning: 'outputId must be an integer.'
    }
  ]
  prompt.get(properties, function (err, result) {
    if (err) { return onErr(err); }
    var inputId = result.inputId;
    var outputId = result.outputId;
    if (inputId) {
      inputId = parseInt(result.inputId, 0);
      console.log('Selected input device: ' + input.getPortName(inputId));
      input.openPort(inputId);
    }
    if (outputId) {
      outputId = parseInt(result.outputId, 0);
      console.log('Selected output device: ' + output.getPortName(outputId));
      output.openPort(inputId);
    } else {
      output = null;
    }
  });
  function onErr(err) {
    console.log(err);
    return 1;
  }

  this.mappingsUpdated = (newMap) => {
    map = newMap;
  }

  this.shutdown = () => {
    console.log("MidiSerialService shutdown");
    if (input && input.closePort) input.closePort();
    if (output && output.closePort) output.closePort();
  }

  return this;
}
