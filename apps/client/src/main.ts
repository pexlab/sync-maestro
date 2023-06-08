import { ZGreeting } from '@sync-maestro/shared-interfaces';
import Bonjour from 'bonjour-service';
import * as macaddress from 'macaddress';
import { z } from 'zod';
import { communicationService, logCommunication } from './communication';
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

export const syncMaestroClient = new SyncMaestroClient();
