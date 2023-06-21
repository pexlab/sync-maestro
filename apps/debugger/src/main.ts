import { SerialPort } from 'serialport'
import process from 'process';

const port = new SerialPort({
    path    : 'COM7',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity  : 'none',
    highWaterMark: 1,
    autoOpen: true
});

let last = process.hrtime();

port.on('data', (data) => {
    
    const byte = data[0];
    
    if(byte === 0x00 || byte === 0xFF){
        return;
    }

    const now = process.hrtime();
    
    console.log(byte + ": " + process.hrtime(last))
    
    last = now;
});