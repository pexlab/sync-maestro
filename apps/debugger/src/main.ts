import * as process from 'process';
import { SerialPort } from 'serialport';

const ttl = new SerialPort( {
    path: '/dev/tty.usbserial-AH06SQPE',
    baudRate: 9600
})

ttl.on('data', (data) => {
    console.log(data[0]);
} );

process.stdin.resume();