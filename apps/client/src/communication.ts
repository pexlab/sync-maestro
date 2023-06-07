import { Logger } from '@nestjs/common';
import { BehaviorSubject, distinctUntilChanged, Subject } from 'rxjs';
import { WebSocket } from 'ws';

export const logCommunication = new Logger( 'Communication' );

export class CommunicationService {
    
    private latestAddress?: string;
    private connectionStatus = new BehaviorSubject( false );
    
    public socket?: WebSocket;
    private messages: Subject<unknown> = new Subject();
    
    constructor() {
        this.connectionStatus.pipe(
            distinctUntilChanged()
        ).subscribe( ( status ) => {
            if ( status ) {
                logCommunication.log( 'Connected successfully' );
            } else {
                logCommunication.error( 'Connection got terminated' );
            }
        } );
    }
    
    public get connection$() {
        return this.connectionStatus.asObservable().pipe(distinctUntilChanged());
    }
    
    public setServer( address: string | undefined ) {
        
        logCommunication.log( 'Connecting to server at ' + address );
        
        if ( this.socket ) {
            this.socket.close();
            this.socket = undefined;
        }
        
        this.latestAddress = address;
        
        if ( address ) {
            this.tryConnectionLoop( address );
        }
    }
    
    private tryConnectionLoop( onAddress: string, delay = 0 ) {
        
        setTimeout( () => {
            
            if ( this.latestAddress === undefined ) {
                return;
            }
            
            if ( this.latestAddress !== onAddress ) {
                return;
            }
            
            if ( this.socket !== undefined ) {
                return;
            }
            
            this.socket = new WebSocket( 'ws://' + this.latestAddress, {
                timeout         : 3500,
                sessionTimeout  : 3500,
                handshakeTimeout: 3500
            } );
            
            this.socket.onopen = () => {
                this.connectionStatus.next( true );
            };
            
            this.socket.onclose = () => {
                
                this.socket = undefined;
                this.connectionStatus.next( false );
                
                this.tryConnectionLoop( onAddress, 500 );
            };
            
            this.socket.onerror = () => {
                
                this.socket = undefined;
                
                if ( this.connectionStatus.getValue() ) {
                    this.connectionStatus.next( false );
                }
                
                this.tryConnectionLoop( onAddress, 500 );
            };
            
            this.socket.onmessage = ( event ) => {
                const message = JSON.parse( String( event.data ) );
                this.messages.next( message );
            };
            
        }, delay );
    }
    
    public isConnected(): this is { socket: WebSocket } {
        return this.connectionStatus.getValue() && this.socket !== undefined;
    }
    
    public readonly messages$ = this.messages.asObservable();
}

export const communicationService = new CommunicationService();