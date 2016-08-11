var relayAddressRegExp = new RegExp("^0[0-8][1-8]$");
var serverAddress = "http://localhost:3000/solenoids/"

$(document).ready(function() {
  setButtonClickEvents();
  getInitialAddresses();
});

function setButtonClickEvents() {
  $('.solenoid div input').keyup( function(event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
      var solenoid = $(this).parent().parent();
      var id = solenoid.attr("solenoid-id");
      var val = solenoid.find("input").val();
      if (relayAddressRegExp.test(val)) {
        selectsolenoidLogo(id);
        solenoid.find(".error-message").hide();
        mapAddress(id, val);
      } else {
        solenoid.find(".error-message").show();
      }
    }
  });

  $('.solenoid-heart-button').click(function() {
    var solenoid = $(this).parent().parent().parent();
    var id = solenoid.attr('solenoid-id');
    selectsolenoidLogo(id);
  });
}

function getInitialAddresses() {
  $.ajax({
    type: "GET",
    url: "/solenoids/addresses",
    success: function(data) {
      writeAddressesToHearts(data);
      writeAddressesToInputs(data);
    }
  });
}

function submitAllAddresses() {
  var newData = {};
  $('.solenoid').each(function(i) {
    var solenoid = $(this);
    var id = solenoid.attr("solenoid-id");
    var val = solenoid.find('input').val();
    newData[id] = val;
  });
  mapAllAddresses(newData);
}

function writeAddressesToHearts(data) {
  for (var id in data) {
    writeAddressToHeart(id, data[id]);
  }
}

function writeAddressToHeart(id, data) {
  $('.small-img#' + id).html('').append(data);
}

function writeAddressesToInputs(data) {
  for (var id in data) {
    $('.solenoid[solenoid-id=' + id +'] input').val(data[id]);
  }
}

function selectsolenoidLogo(id) {
  var selectorStr = ".small-img#" + id;
  $(selectorStr).css("color", "red");
  setTimeout(function() {
    $(selectorStr).css("color", "black");
  }, 500);
}

function mapAllAddresses(map) {
  var mydata = {
    idMap: map
  }
  $.ajax({
    type: "POST",
    url: "solenoids/addresses",
    data: JSON.stringify(mydata),
    contentType: 'application/json',
    success: function(data) {
      writeAddressesToHearts(map);
    }
  })
}

function mapAddress(id, address) {
  var data = {
    address: address
  }
  $.ajax({
    type: "POST",
    url:  '/solenoids/' + id + '/address',
    data: JSON.stringify(data),
    success: function(data) {
      writeAddressToHeart(id, address);
      return
    },
    contentType: 'application/json'
  });
}
