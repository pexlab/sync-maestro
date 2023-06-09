import { select } from '@inquirer/prompts';
import { Timer, ZCommand, ZGreeting } from '@sync-maestro/shared-interfaces';
import { EmptyTimer, SerialTimer } from '@sync-maestro/shared-utils';
import Bonjour from 'bonjour-service';
import * as macaddress from 'macaddress';
import { SerialPort } from 'serialport';
import { z } from 'zod';
import { CommunicationService } from './communication';
import { logCommunication } from './logger';
import { FindFirstLan4 } from './network.util';
import { Obeyer } from './obeyer';

class SyncMaestroClient {
    
    private bonjour = new Bonjour();
    private browser = this.bonjour.find( {
        type: 'sync-maestro-instructor'
    } );
    private obeyer  = new Obeyer();
    
    public findInstructorLoopInterval?: NodeJS.Timer;
    
    constructor() {
        
        communicationService.connection$.subscribe(
            ( state ) => {
                if ( state ) {
                    this.onConnectionStart();
                } else {
                    this.onConnectionTerminated();
                }
            }
        );
        
        this.onStartup();
    }
    
    private onStartup() {
        this.findInstructorLoopInterval = this.findInstructorLoop();
    }
    
    private onShutdown() {
        clearInterval( this.findInstructorLoopInterval );
    }
    
    private onConnectionStart() {
        
        if ( !communicationService.isConnected() ) {
            throw new Error( 'Wrong connection state' );
        }
        
        const ws = communicationService.socket;
        
        macaddress.one().then( ( mac ) => {
            
            const greeting: z.infer<typeof ZGreeting> = {
                type: 'Greeting',
                data: {
                    identifier: mac
                }
            };
            
            if ( ws && ws.readyState === ws.OPEN ) {
                
                ws.send( JSON.stringify( greeting ) );
                
                ws.on( 'message', ( message ) => {
                    
                    try {
                        
                        const parsed = ZCommand.array().safeParse( JSON.parse( message.toString() ) );
                        
                        if ( !parsed.success ) {
                            logCommunication.error( parsed.error );
                            return;
                        }
                        
                        this.obeyer.commands = parsed.data;
                        
                    } catch ( e ) {
                        logCommunication.error( e );
                    }
                } );
            }
        } );
    }
    
    private onConnectionTerminated() {
    
    }
    
    private findInstructorLoop() {
        
        return setInterval( () => {
            
            if ( communicationService.isConnected() ) {
                return;
            }
            
            const service = this.browser.services[ 0 ];
            
            if ( !service ) {
                this.browser.update();
                return;
            }
            
            const address = FindFirstLan4( service.addresses ?? [] );
            
            if ( !address ) {
                logCommunication.error( 'A discovered instructor has no address' );
                return;
            }
            
            logCommunication.log( 'Discovered a instructor at ' + address );
            
            communicationService.setServer( address + ':' + service.port );
            
        }, 500 );
    }
}

export let communicationService!: CommunicationService;
export let syncMaestroClient!: SyncMaestroClient;
export let timer!: Timer;

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
                        description: port.manufacturer,
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
    
    communicationService = new CommunicationService();
    syncMaestroClient    = new SyncMaestroClient();
};

bootstrap().then();