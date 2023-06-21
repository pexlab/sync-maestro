import * as fs from 'fs';

const serialPortPath = '/dev/tty.usbserial-AH06SQPE'; // Replace with the actual path of your serial port

let last = performance.now();
let skip = false;

fs.open(serialPortPath, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK, (err, fd) => {
    if (err) {
        console.error('Error opening serial port:', err);
        return;
    }
    
    const readFromSerial = () => {
        const buffer = Buffer.alloc(1);
        
        fs.read(fd, buffer, 0, 1, null, (err, bytesRead) => {
            if (err) {
                //console.error('Error reading from serial port:', err);
                readFromSerial();
                
                return;
            }
            
            if (bytesRead > 0) {
                // Process the received byte
                
                const b = buffer.slice(0, bytesRead)[0];
                
                if(b === 0x00){
                    skip = true;
                    readFromSerial();
                    return;
                }
                
                if(b === 0xFF){
                    skip = false;
                    readFromSerial();
                    return;
                }
                
                if(skip){
                    readFromSerial();
                    return;
                }
                
                const now = performance.now();
                
                console.log(b + ": " + (now-last))
                
                last = now;
            }
            
            // Continue reading from the serial port
            readFromSerial();
        });
    };
    
    readFromSerial(); // Start reading from the serial port
});