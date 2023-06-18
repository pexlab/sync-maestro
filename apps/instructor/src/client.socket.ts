import { ZClientToServerCommand } from '@sync-maestro/shared-interfaces';
import { parseZodFromJSON } from '@sync-maestro/shared-utils';
import Bonjour from 'bonjour-service';
import { BehaviorSubject, Subject } from 'rxjs';
import { v4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { logClient, logMessage } from './util/logger.util';

export class ClientSocket {
    
    public bonjour = new Bonjour();
    
    public socketServer = new WebSocketServer( { port: 3001 } );
    
    public readonly sessionToNameMap = new Map<string, string>();
    public readonly nameToSocketMap  = new Map<string, WebSocket>();
    
    public readonly connectedSubject = new Subject<string>();
    public readonly disconnectedSubject = new Subject<string>();
    public readonly clientListSubject = new BehaviorSubject<string[]>( [] );
    
    public readonly messageSubject = new Subject<[ string, string ]>();
    
    constructor() {
        
        this.socketServer.on( 'listening', () => {
            this.bonjour.publish( {
                name: 'Sync Maestro Instructor',
                type: 'sync-maestro-instructor',
                port: 3001
            } );
        } );
        
        this.socketServer.on( 'connection', ( client ) => {
            
            const session = v4();
            
            logClient(
                'neutral', [ session ],
                'Client has connected'
            );
            
            let name: string | undefined;
            
            let registrationTimeout: NodeJS.Timeout | undefined = setTimeout( () => {
                
                logClient(
                    'warning', [ session ],
                    'Client did not register in time. Closing session'
                );
                
                client.close();
                
                registrationTimeout = undefined;
                
            }, 5000 );
            
            client.on( 'message', ( message ) => {
                
                try {
                    
                    const parsed = parseZodFromJSON(ZClientToServerCommand, message.toString());
                    
                    switch ( parsed.type ) {
                        
                        case 'Registration': {
                            
                            if ( registrationTimeout ) {
                                clearTimeout( registrationTimeout );
                                registrationTimeout = undefined;
                            }
                            
                            if ( Array.from(
                                this.sessionToNameMap.values()
                            ).includes( parsed.name ) ) {
                                
                                logClient(
                                    'warning', [ session ],
                                    `Client with name ${ parsed.name } already connected. Closing session`
                                );
                                
                                client.close();
                                
                                return;
                            }
                            
                            name = parsed.name;
                            
                            this.sessionToNameMap.set( session, name );
                            this.nameToSocketMap.set( name, client );
                            
                            this.updateClients();
                            
                            this.connectedSubject.next( name );
                            
                            break;
                        }
                        
                        default: {
                            
                            if ( !name ) {
                                
                                logClient(
                                    'warning', [ session ],
                                    'Client sent a message without registering first. Ignoring the message'
                                );
                                
                                return;
                            }
                            
                            this.messageSubject.next( [ name, message.toString() ] );
                            
                            break;
                        }
                    }
                    
                } catch ( ignored ) {
                    logClient(
                        'warning', [ session, name ],
                        'Client sent an invalid message:', message.toString()
                    );
                }
            } );
            
            client.on( 'close', () => {
                
                logClient(
                    'warning', [ session, name ],
                    'Client has disconnected'
                );
                
                if ( registrationTimeout ) {
                    clearTimeout( registrationTimeout );
                    registrationTimeout = undefined;
                }
                
                this.sessionToNameMap.delete( session );
                
                if ( name ) {
                    this.nameToSocketMap.delete( name );
                }
                
                this.updateClients();
                
                if ( name ) {
                    this.disconnectedSubject.next( name );
                }
            } );
        } );
    }
    
    private updateClients() {
        this.clientListSubject.next( Array.from( this.nameToSocketMap.keys() ) );
    }
    
    public async shutdownAndUnpublish() {
        
        return new Promise<void>( ( resolve ) => {
            
            logMessage( 'Un-publishing service...' );
            
            this.bonjour.unpublishAll( () => {
                
                this.bonjour.destroy();
                
                logMessage( 'Closing socket...' );
                
                this.socketServer.close( () => {
                    
                    resolve();
                } );
            } );
        } );
    }
}