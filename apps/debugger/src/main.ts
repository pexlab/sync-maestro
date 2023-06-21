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
let skip = false;

port.on('data', (data) => {
    
    const b = data[0];
    
    if(b === 0x00){
        skip = true;
        return;
    }
    
    if(b === 0xFF){
        skip = false;
        return;
    }
    
    if(skip){
        return;
    }
    
    const now = performance.now();
    
    console.log(b + ": " + ((10 - (now-last)) * -1))
    
    last = now;
});