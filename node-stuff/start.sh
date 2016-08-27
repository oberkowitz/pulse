export USBSERIAL=`ls /dev/tty.usbserial-*`;
echo "Using usbserial port $USBSERIAL";
node server.js;
