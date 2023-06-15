import { ZGreeting } from '@sync-maestro/shared-interfaces';
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
            
            let name: string | undefined;
            
            const greetTimeout = setTimeout( () => {
                
                log.error( `Client did not send a greeting in time. Closing session (session-${ session })` );
                
                client.close();
                
            }, 5000 );
            
            client.on( 'message', ( message ) => {
                
                try {
                    
                    /* Try greeting message parsing */
                    
                    const parsed = ZGreeting.parse( JSON.parse( message.toString() ) );
                    
                    clearTimeout( greetTimeout );
                    
                    log.log( `Client identified (session-${ session } as name-${ parsed.data.identifier })` );
                    
                    if ( Array.from(
                        this.registeredClientSessionToNameMap.values()
                    ).includes( parsed.data.identifier ) ) {
                        log.warn( `Client with name ${ parsed.data.identifier } already connected. Rejecting / closing session (session-${ session })` );
                        client.close();
                        return;
                    }
                    
                    name = parsed.data.identifier;
                    
                    this.registeredClientSessionToNameMap.set( session, name );
                    this.registeredClientNameToSocketMap.set( name, client );
                    
                    this.updateClients();
                    
                    this.clientNameConnectedSubject.next( name );
                    
                } catch ( ignored ) {
                    
                    /* Else emit message */
                    
                    if ( !name ) {
                        log.warn( `Client sent a message without greeting first (session-${ session })` );
                        return;
                    }
                    
                    this.clientNameMessageSubject.next( [ name, message.toString() ] );
                }
            } );
            
            client.on( 'close', () => {
                
                if ( name ) {
                    log.log( `Client disconnected (name-${ name }, session-${ session })` );
                } else {
                    log.log( `Client disconnected (session-${ session })` );
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