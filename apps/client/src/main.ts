import { EmptyTimer, Timer } from '@sync-maestro/shared-utils';
import { SerialPort } from 'serialport';
import { SerialTimer } from 'shared-backend-utils';
import YAML from 'yaml';
import { Obeyer } from './obeyer/obeyer';
import { askList } from "./util/console.util";

export let timer: Timer;
export let shaders: string[];

const bootstrap = async () => {

    const timerType = await askList( 'Choose the conductor connection type', [
        [ 'Through a serial connection', 'Serial', undefined ],
        [ 'Via Bluetooth-Low-Energy', 'None', undefined ],
        [ 'Over the network', 'None', undefined ],
        [ 'None (Dummy)', 'None', undefined ]
    ]);
    
    switch ( timerType ) {
        
        case 'Serial': {
            
            const ports = await SerialPort.list();

            const port = await askList( 'Choose the serial port for the conductor', ports.reverse().map( ( port ) => {
                return [ port.path, port.path, '{bold}Information available for this port:{/bold}\n\n' + YAML.stringify( port ).trim() ];
            } ) );
            
            timer = new SerialTimer( port, {
                handleFaultyTick: 'Replace',
                macroDiscrepancy: {
                    exceedThreshold: {
                        disable: 0,
                        warning: 0,
                        error: 0
                    },
                    undercutThreshold:{
                        disable: 0,
                        warning: 0,
                        error: 0
                    }
                },
                microDiscrepancy: {
                    exceedThreshold: {
                        disable: 0,
                        warning: 0,
                        error: 0
                    },
                    undercutThreshold:{
                        disable: 0,
                        warning: 0,
                        error: 0
                    }
                }
            });
            
            break;
        }
        
        default:
            timer = new EmptyTimer();
            break;
    }
    
    new Obeyer();
};

bootstrap().then();