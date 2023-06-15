import { select } from '@inquirer/prompts';
import * as process from 'process';
import { SerialPort } from 'serialport';
import YAML from 'yaml';

async function boostrap() {
    
    const ports = await SerialPort.list();
    
    const port = await select( {
        message: 'Select a port',
        choices: ports.map( ( port ) => {
            return {
                name       : port.path,
                description: '\n<-- Information about that port -->\n\n' + YAML.stringify( port ),
                value      : port.path
            };
        } )
    } );
    
    const ttl = new SerialPort( {
        path    : port,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity  : 'none'
    } );
    
    let buffer = Buffer.alloc(0);
    
    let packetStartByte: 0 | 255 | null = null;
    
    ttl.on('data', (data) => {
        
        buffer = Buffer.concat([buffer, data]);
        
        while (buffer.length > 0) {
            if (packetStartByte === null) {
                // If the first byte is 255 or 0, it is the start of a packet
                if (buffer[0] === 255 || buffer[0] === 0) {
                    packetStartByte = buffer[0];
                }
                buffer = buffer.slice(1);
            } else {
                if (buffer.length < 1) {
                    // If we don't have enough data for a packet, wait for more
                    break;
                }
                let packetPayload = buffer.slice(0, 1);
                buffer = buffer.slice(1);
                // Now you can handle 'packetStartByte' and 'packetPayload' as a complete piece of data
                console.log(packetPayload[0]);
                packetStartByte = null;
            }
        }
    });
    
    process.stdin.resume();
}

boostrap().then();
