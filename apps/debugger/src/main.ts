import { SerialPort } from 'serialport'

const port = new SerialPort({
    path    : 'COM7',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity  : 'none',
    highWaterMark: 1,
    autoOpen: true
});

let last = performance.now();

port.on('data', (data) => {
    
    const byte = data[0];
    
    if(byte === 0x00 || byte === 0xFF){
        return;
    }
    
    const now = performance.now();
    
    console.log(byte + ": " + (now-last))
    
    last = now;
});