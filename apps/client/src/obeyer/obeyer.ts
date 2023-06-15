import { ZGreeting } from '@sync-maestro/shared-interfaces';
import Bonjour from 'bonjour-service';
import macaddress from 'macaddress';
import { z } from 'zod';
import { shaders } from '../main';
import { MPV } from '../mpv';
import { FindFirstLan4, logger } from '../util';
import { ObeyerSocket } from './obeyer.socket';

export class Obeyer {
    
    private socket;
    
    private bonjour;
    private browser;
    private mpv;
    
    constructor() {
        
        this.socket = new ObeyerSocket();
        
        this.socket.connection$.subscribe(
            ( state ) => {
                if ( state ) {
                    
                    macaddress.one().then( ( mac ) => {
                        
                        const client = this.socket.client;
                        
                        if ( !client ) {
                            return;
                        }
                        
                        const greeting: z.infer<typeof ZGreeting> = {
                            type: 'Greeting',
                            data: {
                                identifier: mac
                            }
                        };
                        
                        client.send( JSON.stringify( greeting ) );
                        
                        let currentUrl = '';
                        
                        client.on( 'message', ( message ) => {
                            
                            try {
                                
                                const parsed = JSON.parse( message.toString() );
                                
                                console.log( 'Got message from instructor', parsed.data );
                                
                                if ( !this.mpv ) {
                                    return;
                                }
                                
                            } catch ( e ) {
                                logger.obeyerSocket.error( e );
                            }
                        } );
                    } );
                }
            }
        );
        
        this.bonjour = new Bonjour();
        
        this.browser = this.bonjour.find( {
            type: 'sync-maestro-instructor'
        } );
        
        logger.obeyer.log( 'Searching for instructors...' );
        
        setInterval( () => {
            
            if ( this.socket.isConnected() ) {
                return;
            }
            
            const service = this.browser.services[ 0 ];
            
            if ( !service ) {
                this.browser.update();
                return;
            }
            
            const address = FindFirstLan4( service.addresses ?? [] );
            
            if ( !address ) {
                logger.obeyer.warn( 'A discovered instructor has no reachable address' );
                return;
            }
            
            this.socket.connect( address + ':' + service.port );
            
        }, 50 );
        
        this.mpv = new MPV();
        
        this.mpv.initialize( {
            screen: 0,
            shaders
        } );
    }
}