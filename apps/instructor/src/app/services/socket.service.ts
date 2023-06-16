import { ZClientToServerCommand } from '@sync-maestro/shared-interfaces';
import { parseJSON } from '@sync-maestro/shared-utils';
import Bonjour from 'bonjour-service';
import { BehaviorSubject, Subject } from 'rxjs';
import { v4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { log } from '../logger';

export class SocketService {
    
    public bonjour = new Bonjour();
    
    public server = new WebSocketServer( { port: 3001 } );
    
    public readonly registeredClientSessionToNameMap = new Map<string, string>();
    public readonly registeredClientNameToSocketMap  = new Map<string, WebSocket>();
    
    public readonly registeredClientNamesSubject = new BehaviorSubject<string[]>( [] );
    
    public readonly clientNameConnectedSubject    = new Subject<string>();
    public readonly clientNameDisconnectedSubject = new Subject<string>();
    public readonly clientNameMessageSubject      = new Subject<[ string, string ]>();
    
    constructor() {
        
        this.server.on( 'listening', () => {
            this.bonjour.publish( {
                name: 'Sync Maestro Instructor',
                type: 'sync-maestro-instructor',
                port: 3001
            } );
        } );
        
        this.server.on( 'connection', ( client ) => {
            
            const session = v4();
            
            log.warn( `Client connected (session-${ session })` );
            
            let name: string | undefined;
            
            let registrationTimeout: NodeJS.Timeout | undefined = setTimeout( () => {
                
                log.error( `Client did not register in time. Closing session (session-${ session })` );
                
                client.close();
                
                registrationTimeout = undefined;
                
            }, 5000 );
            
            client.on( 'message', ( message ) => {
                
                try {
                    
                    const parsed = ZClientToServerCommand.parse( parseJSON( message.toString() ) );
                    
                    switch ( parsed.type ) {
                        
                        case 'Registration': {
                            
                            if ( registrationTimeout ) {
                                clearTimeout( registrationTimeout );
                                registrationTimeout = undefined;
                            }
                            
                            log.log( `Client identified (session-${ session } as name-${ parsed.name })` );
                            
                            if ( Array.from(
                                this.registeredClientSessionToNameMap.values()
                            ).includes( parsed.name ) ) {
                                log.warn( `Client with name ${ parsed.name } already connected. Rejecting / closing session (session-${ session })` );
                                client.close();
                                return;
                            }
                            
                            name = parsed.name;
                            
                            this.registeredClientSessionToNameMap.set( session, name );
                            this.registeredClientNameToSocketMap.set( name, client );
                            
                            this.updateClients();
                            
                            this.clientNameConnectedSubject.next( name );
                            
                            break;
                        }
                        
                        default: {
                            
                            if ( !name ) {
                                log.warn( `Client sent a message without registering first, ignoring (session-${ session })` );
                                return;
                            }
                            
                            this.clientNameMessageSubject.next( [ name, message.toString() ] );
                            
                            break;
                        }
                    }
                    
                } catch ( ignored ) {
                    
                    if ( name ) {
                        log.warn( `Client sent an invalid message (name-${ name }, session-${ session })` );
                    } else {
                        log.warn( `Client sent an invalid message (session-${ session })` );
                    }
                    
                    log.warn( JSON.stringify( ignored, null, 2 ) );
                }
            } );
            
            client.on( 'close', () => {
                
                if ( name ) {
                    log.warn( `Client disconnected (name-${ name }, session-${ session })` );
                } else {
                    log.warn( `Client disconnected (session-${ session })` );
                }
                
                if ( registrationTimeout ) {
                    clearTimeout( registrationTimeout );
                    registrationTimeout = undefined;
                }
                
                this.registeredClientSessionToNameMap.delete( session );
                
                if ( name ) {
                    this.registeredClientNameToSocketMap.delete( name );
                }
                
                this.updateClients();
                
                if ( name ) {
                    this.clientNameDisconnectedSubject.next( name );
                }
            } );
        } );
    }
    
    public getClient( name: string ) {
        return this.registeredClientNameToSocketMap.get( name );
    }
    
    public async closeServer() {
        return new Promise<void>( ( resolve ) => {
            this.server.close();
            this.bonjour.unpublishAll( () => {
                this.bonjour.destroy();
                resolve();
            } );
        } );
    }
    
    private updateClients() {
        this.registeredClientNamesSubject.next( Array.from( this.registeredClientNameToSocketMap.keys() ) );
    }
}

export const socketService = new SocketService();