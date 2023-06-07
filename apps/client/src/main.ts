import { ZGreeting } from '@sync-maestro/shared-interfaces';
import { FindFirstLan4 } from '@sync-maestro/shared-utils';
import Bonjour from 'bonjour-service';
import * as macaddress from 'macaddress';
import { z } from 'zod';
import { communicationService, logCommunication } from './communication';

class SyncMaestroClient {
    
    private bonjour = new Bonjour();
    private browser = this.bonjour.find( {
        type: 'sync-maestro-instructor'
    } );
    
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
                logCommunication.error( 'A discovered bonjour service has no address' );
                return;
            }
            
            logCommunication.log( 'Discovered a sync-maestro-instructor service at ' + address );
            
            communicationService.setServer( address + ':' + service.port );
            
        }, 500 );
    }
}

export const syncMaestroClient = new SyncMaestroClient();

// const mpv = new MPV();
//
// mpv.connect().then( () => {
//
//     mpv.messages.subscribe( ( message ) => {
//
//         if ( message.event && typeof message.event === 'string' ) {
//
//             if ( message.event === 'property-change' ) {
//                 return;
//             }
//
//             logMPV.debug( message.event );
//
//         } else if ( message.request_id === undefined ) {
//             logMPV.debug( message );
//         }
//     } );
//
//     mpv.play( path.join( process.cwd(), 'demo.mp4' ) ).then( () => {
//
//         mpv.pause().then( () => {
//             mpv.execute( 'seek', '200', 'absolute' ).then();
//         } );
//
//         const ttl = new SerialPort( {
//             path    : '/dev/tty.usbserial-FTAQEW6P',
//             baudRate: 9600
//         } );
//
//         ttl.on( 'data', function( data ) {
//
//             console.log( data[ 0 ] );
//
//             if ( data[ 0 ] % 30 === 1 ) {
//                 mpv.resume().then();
//             }
//         } );
//     } );
// } );
