import { SerialPort } from "serialport";
import process from "process";
import { execSync } from "child_process";

const processId = process.pid;

switch (process.platform) {
  case "win32":
    console.log(execSync("wmic process where ProcessId=\"${processId}\" CALL setpriority \"128\"").toString());
    break;
  case "linux":
  case "darwin":
    console.log(execSync(`renice -n -20 -p ${processId}`).toString());
    break;
}

const port = new SerialPort({
  path: "COM8",
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
  const diff = elapsedHrtime[0] * 1000 + elapsedHrtime[1] / 1e6;

  console.log(byte + ": " + ((10 - diff) * -1));

  last = now;
});