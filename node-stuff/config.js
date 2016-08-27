module.exports = {
  FAKE_SERIAL: process.env.FAKE_SERIAL || false,
  USBSERIAL: process.env.USBSERIAL || "/dev/tty.usbserial",
  INPUT_ID: process.env.INPUT_ID || 0
}
