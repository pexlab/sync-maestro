import { Timer } from '@sync-maestro/shared-interfaces';
import { EmptyTimer } from '@sync-maestro/shared-utils';
import process from 'process';
import { SerialPort } from 'serialport';
import { SerialTimer } from 'shared-backend-utils';
import YAML from 'yaml';
import { Obeyer } from './obeyer/obeyer';
import { askList, log, updateStatistics } from './util/console.util';

export let timer: Timer;

const bootstrap = async () => {
    
    const timerType = await askList( 'How do you connect to the conductor?', [
        [ 'Through a serial connection', 'Serial', undefined ],
        [ 'Via Bluetooth-Low-Energy', 'None', undefined ],
        [ 'Over the network', 'None', undefined ],
        [ 'None (Dummy)', 'None', undefined ]
    ] );
    
    switch ( timerType ) {
        
        case 'Serial': {
            
            const ports = await SerialPort.list();
            
            const port = await askList(
                'Choose the serial port for the conductor:',
                ports.reverse().map( ( port ) => {
                    return [
                        port.path,
                        port.path,
                        '{bold}Information available for this port:{/bold}\n\n' +
                        YAML.stringify( port ).trim()
                    ];
                } )
            );
            
            timer = new SerialTimer( port );
    
            log( 'Using conductor on port: ' + port );
            
            break;
        }
        
        default:
            timer = new EmptyTimer();
            break;
    }
    
    if ( !timer ) {
        process.exit( 1 );
        return;
    }
    
    timer.onTick.subscribe( () => {
        updateStatistics();
    } );
    
    new Obeyer();
};

bootstrap().then();