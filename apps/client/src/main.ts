import { select } from '@inquirer/prompts';
import { Timer } from '@sync-maestro/shared-interfaces';
import { EmptyTimer, SerialTimer } from '@sync-maestro/shared-utils';
import { SerialPort } from 'serialport';
import YAML from 'yaml';
import { Obeyer } from './obeyer/obeyer';
import { Anime4K } from './util';

export const MainDirectory = __dirname;

export let timer!: Timer;
export let shaders!: string[];

const bootstrap = async () => {
    
    const timerType = await select( {
        message: 'Select a timer type',
        choices: [
            { name: 'Serial', value: 'Serial' },
            { name: 'Network', value: 'Network' },
            { name: 'None', value: 'None' }
        ]
    } );
    
    switch ( timerType ) {
        
        case 'Serial': {
            
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
            
            timer = new SerialTimer( port );
            
            break;
        }
        
        default:
            timer = new EmptyTimer();
            break;
    }
    
    shaders = await select( {
        message: 'Select a video shader',
        choices: [
            { name: 'None', value: [] },
            { name: 'Anime4K Low-End A', value: Anime4K.LowEnd.A },
            { name: 'Anime4K Low-End B', value: Anime4K.LowEnd.B },
            { name: 'Anime4K Low-End C', value: Anime4K.LowEnd.C },
            { name: 'Anime4K Low-End A + A', value: Anime4K.LowEnd.AA },
            { name: 'Anime4K Low-End B + B', value: Anime4K.LowEnd.BB },
            { name: 'Anime4K Low-End C + A', value: Anime4K.LowEnd.CA },
            { name: 'Anime4K High-End A', value: Anime4K.HighEnd.A },
            { name: 'Anime4K High-End B', value: Anime4K.HighEnd.B },
            { name: 'Anime4K High-End C', value: Anime4K.HighEnd.C },
            { name: 'Anime4K High-End A + A', value: Anime4K.HighEnd.AA },
            { name: 'Anime4K High-End B + B', value: Anime4K.HighEnd.BB },
            { name: 'Anime4K High-End C + A', value: Anime4K.HighEnd.CA }
        ]
    } );
    
    new Obeyer();
};

bootstrap().then();