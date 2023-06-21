import { SerialPort } from "serialport";
import process from "process";

const port = new SerialPort({
  path: "COM7",
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  highWaterMark: 1,
  autoOpen: true,
  xon: false,
  xoff: false,
  xany: true,
  rtscts: false,
  hupcl: false,
  vmin: 0,
  vtime: 0
});

let last = process.hrtime();

port.on("data", (data) => {

  const byte = data[0];

  if (byte === 0x00 || byte === 0xFF) {
    return;
  }

  const now = process.hrtime();
  const elapsedHrtime = process.hrtime(last);

  console.log(byte + ": " + elapsedHrtime[0] * 1000 + elapsedHrtime[1] / 1e6);

  last = now;
});