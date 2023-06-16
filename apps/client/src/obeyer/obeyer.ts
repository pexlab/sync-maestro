import { IClientToServerCommand, ZClientToServerCommand, ZServerToClientCommand } from '@sync-maestro/shared-interfaces';
import Bonjour from 'bonjour-service';
import macaddress from 'macaddress';
import * as os from 'os';
import * as path from 'path';
import { timer } from '../main';
import { Vlc } from '../mpv';
import { FindFirstLan4, logger } from '../util';
import { ObeyerSocket } from './obeyer.socket';

export class Obeyer {
    
    private socket;
    
    private bonjour;
    private browser;
    private vlc;
    private resumeWhen = {
        macro: NaN,
        micro: NaN
    };
    
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
                        
                        const registration = ZClientToServerCommand.parse( {
                            type: 'Registration',
                            name: mac
                        } as IClientToServerCommand );
                        
                        client.send( JSON.stringify( registration ) );
                        
                        let currentUrl = '';
                        
                        client.on( 'message', async ( message ) => {
                            
                            if ( !this.vlc ) {
                                logger.obeyer.warn( 'Ignored a message because MPV isn\'t initialized' );
                                return;
                            }
                            
                            logger.obeyer.log( 'Received: ' + message.toString() );
                            
                            try {
                                
                                const parsed = ZServerToClientCommand.parse( JSON.parse( message.toString() ) );
                                
                                switch ( parsed.type ) {
                                    
                                    case 'PauseImmediatelyAt':
                                        
                                        this.resumeWhen = {
                                            macro: NaN,
                                            micro: NaN
                                        };
                                        
                                        this.sendReadyForTakeoff( false );
                                        
                                        if ( parsed.url !== currentUrl ) {
                                            
                                            currentUrl = parsed.url;
                                            
                                            await this.vlc.control.loadFile( path.join( os.homedir(), parsed.url ) );
                                            
                                            logger.obeyer.log( 'Loaded file ' + parsed.url );
                                        }
                                        
                                        await this.vlc.control.pause_at( parsed.be_at );
                                        
                                        logger.obeyer.log( 'Paused at ' + parsed.be_at + 's (' + parsed.url + ')' );
                                        
                                        this.sendReadyForTakeoff( true );
                                        
                                        break;
                                    
                                    case 'ResumeWhen':
                                        
                                        this.resumeWhen = {
                                            macro: parsed.macro,
                                            micro: parsed.micro
                                        };
                                        
                                        logger.obeyer.log( 'Resuming when it strikes ' + parsed.macro + 'M:' + parsed.micro + 'm' );
                                        
                                        break;
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
            
        }, 2000 );
        
        this.vlc = new Vlc();
        
        timer.enable();
        
        timer.onTick.subscribe( () => {
            
            const macro = timer.currentMacroTick;
            const micro = timer.currentMicroTick;
            
            if ( macro === this.resumeWhen.macro && micro === this.resumeWhen.micro ) {
                this.vlc.control.resume();
                logger.obeyer.log( 'Resumed' );
            }
        } );
    }
    
    private sendReadyForTakeoff( state: boolean ) {
        
        const cmd = ZClientToServerCommand.parse( {
            type: 'ReadyForTakeoff',
            state
        } as IClientToServerCommand );
        
        this.socket.client?.send( JSON.stringify( cmd ) );
    }
}