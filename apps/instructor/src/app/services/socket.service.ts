import { ZGreeting } from '@sync-maestro/shared-interfaces';
import Bonjour from 'bonjour-service';
import { BehaviorSubject, Subject } from 'rxjs';
import { v4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { log } from '../logger';

export class SocketService {
    
    public server  = new WebSocketServer( { port: 3001 } );
    public bonjour = new Bonjour();
    
    private clientIdentifierMap = new Map<string, string | undefined>();
    private clientMap           = new Map<string, WebSocket>();
    
    public readonly clientsSubject = new BehaviorSubject( [] as string[] );
    
    public readonly clientConnected    = new Subject<string>();
    public readonly clientDisconnected = new Subject<string>();
    
    constructor() {
        
        this.server.on( 'listening', () => {
            this.bonjour.publish( {
                name: 'Sync Maestro Instructor',
                type: 'sync-maestro-instructor',
                port: 3001
            } );
        } );
        
        this.server.on( 'connection', ( client ) => {
            
            const uid = v4();
            let identifier: string | undefined;
            
            this.clientIdentifierMap.set( uid, undefined );
            
            const greetTimeout = setTimeout( () => {
                
                log.error( `Client ${ uid } did not send a greeting in time. Closing connection.` );
                
                this.clientIdentifierMap.delete( uid );
                this.clientMap.delete( uid );
                
                this.updateClients();
                
                client.close();
                
            }, 5000 );
            
            client.on( 'message', ( message ) => {
                try {
                    
                    const parsed = ZGreeting.parse( JSON.parse( message.toString() ) );
                    clearTimeout( greetTimeout );
                    
                    log.log( `Client ${ uid } identified as ${ parsed.data.identifier }` );
                    
                    identifier = parsed.data.identifier;
                    
                    this.clientIdentifierMap.set( uid, identifier );
                    this.clientMap.set( uid, client );
                    
                    this.updateClients();
                    
                    this.clientConnected.next( identifier );
                    
                } catch ( ignored ) {}
            } );
            
            client.on( 'close', () => {
                
                log.log( `Client ${ uid } disconnected` );
                
                this.clientIdentifierMap.delete( uid );
                this.clientMap.delete( uid );
                
                this.updateClients();
                
                if ( identifier ) {
                    this.clientDisconnected.next( identifier );
                }
            } );
        } );
    }
    
    public sendAll( message: Record<string, any> ) {
        this.clientMap.forEach( ( client ) => {
            client.send( JSON.stringify( message ) );
        } );
    }
    
    public sendClient( identifier: string, message: Record<string, any> ) {
        const client = Array.from( this.clientIdentifierMap.entries() ).find( ( [ , value ] ) => value === identifier );
        if ( client ) {
            this.clientMap.get( client[ 0 ] )?.send( JSON.stringify( message ) );
        }
    }
    
    public async close() {
        return new Promise<void>( ( resolve ) => {
            this.server.close();
            this.bonjour.unpublishAll( () => {
                this.bonjour.destroy();
                resolve();
            } );
        } );
    }
    
    private updateClients() {
        this.clientsSubject.next( Array.from( this.clientIdentifierMap.values() ).filter( ( value ) => value !== undefined ) as string[] );
    }
}

export const socketService = new SocketService();