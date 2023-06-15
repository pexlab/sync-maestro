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
        path: port,
        baudRate: 9600
    })
    
    ttl.on('data', (data) => {
        console.log(data[0]);
    } );
    
    process.stdin.resume();
}

boostrap().then()
