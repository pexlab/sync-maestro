import { BehaviorSubject, distinctUntilChanged, skip, Subject } from 'rxjs';
import { WebSocket } from 'ws';
import { logger } from '../util';

export class ObeyerSocket {
    
    public client?: WebSocket;
    
    private latestAddress?: string;
    
    private connectionStatus = new BehaviorSubject( false );
    
    private messages: Subject<unknown> = new Subject();
    
    constructor() {
        this.connectionStatus.pipe(
            distinctUntilChanged(),
            skip( 1 )
        ).subscribe( ( status ) => {
            if ( status ) {
                logger.obeyerSocket.log( 'Connection to instructor established' );
            } else {
                logger.obeyerSocket.warn( 'Connection to instructor terminated' );
            }
        } );
    }
    
    public get connection$() {
        return this.connectionStatus.asObservable().pipe( distinctUntilChanged() );
    }
    
    public connect( address: string | undefined ) {
        
        if ( this.client ) {
            this.client.close();
            this.client = undefined;
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
            
            if ( this.client !== undefined ) {
                return;
            }
            
            this.client = new WebSocket( 'ws://' + this.latestAddress, {
                timeout         : 3500,
                sessionTimeout  : 3500,
                handshakeTimeout: 3500
            } );
            
            this.client.onopen = () => {
                this.connectionStatus.next( true );
            };
            
            this.client.onclose = () => {
                
                this.client = undefined;
                this.connectionStatus.next( false );
                
                this.tryConnectionLoop( onAddress, 50 );
            };
            
            this.client.onerror = () => {
                
                this.client = undefined;
                
                if ( this.connectionStatus.getValue() ) {
                    this.connectionStatus.next( false );
                }
                
                this.tryConnectionLoop( onAddress, 50 );
            };
            
            this.client.onmessage = ( event ) => {
                const message = JSON.parse( String( event.data ) );
                this.messages.next( message );
            };
            
        }, delay );
    }
    
    public isConnected(): this is { socket: WebSocket } {
        return this.connectionStatus.getValue() && this.client !== undefined;
    }
    
    public readonly messages$ = this.messages.asObservable();
}
