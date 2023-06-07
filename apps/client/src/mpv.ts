import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import net from 'net';
import { filter, Observable, Subject, take } from 'rxjs';
import { logClient, logSocket } from './logger';

class MPV {
    
    public socket?: net.Socket;
    
    public socketPath: string;
    public mpv?: ChildProcessWithoutNullStreams;
    
    public readonly messages = new Subject<Record<string, any>>();
    public readonly events   = new Subject<string>();
    
    private lastRequestId = NaN;
    
    constructor( path = '/tmp/mpv-socket-' + Math.random().toString( 36 ).substr( 2, 9 ) ) {
        
        logSocket.debug( 'Path: ' + path );
        
        this.socketPath = path;
        
        this.mpv = spawn( 'mpv', [
            '--input-ipc-server=' + this.socketPath,
            '--force-window',
            '--idle',
            '--profile=low-latency',
            '--screen=1',
            '--no-border',
            '--no-msg-color',
            '--term-osd=no',
            '--msg-level=all=warn,ao/alsa=error'
        ], {} );
        
        this.mpv.on( 'close', ( code ) => {
            logClient.error( `MPV process exited with code ${ code }` );
            this.mpv = undefined;
        } );
    }
    
    async connect() {
        
        logSocket.debug( 'Connecting...' );
        
        while ( !this.socket ) {
            
            try {
                
                const socket = net.createConnection( this.socketPath );
                
                await new Promise<void>( ( resolve, reject ) => {
                    
                    socket.on( 'connect', () => {
                        
                        logSocket.log( 'Connected' );
                        
                        this.socket = socket;
                        
                        this.socket.on( 'data', ( data ) => {
                            
                            const messages = data.toString().split( '\n' ).filter( Boolean );
                            
                            for ( const message of messages ) {
                                
                                try {
                                    
                                    const messageObject = JSON.parse( message );
                                    
                                    this.messages.next( messageObject );
                                    
                                    if ( messageObject.event && typeof messageObject.event === 'string' ) {
                                        this.events.next( messageObject.event );
                                    }
                                    
                                } catch ( e ) {
                                    logSocket.error( [ 'Error parsing message: ', message ] );
                                }
                            }
                        } );
                        
                        resolve();
                    } );
                    
                    socket.on( 'error', ( err ) => {
                        reject( err );
                    } );
                    
                } );
                
            } catch ( ignored ) {
                /* Retry until success */
            }
        }
    }
    
    public execute<T>( command: string, ...params: unknown[] ): Promise<{ took: number, data: T }> {
        
        if ( !this.socket ) {
            throw new Error( 'Socket not connected' );
        }
        
        const id = isNaN( this.lastRequestId ) ? this.lastRequestId = 0 : ++this.lastRequestId;
        
        const message = {
            request_id: id,
            command   : [ command, ...params ]
        };
        
        this.socket.write(
            JSON.stringify( message ) +
            '\n'
        );
        
        const writeEnd = performance.now();
        
        return new Promise<{ took: number, data: T }>( ( resolve, reject ) => {
            this.messages.pipe(
                filter( ( message ) => message.request_id === id ),
                take( 1 )
            ).subscribe( ( message ) => {
                if ( !message.error || ( message.error && message.error !== 'success' ) ) {
                    reject( message );
                } else {
                    resolve( {
                        took: performance.now() - writeEnd,
                        data: message.data
                    } );
                }
            } );
        } );
    }
    
    public waitForEvent( event: string ) {
        return new Promise<void>( ( resolve ) => {
            this.events.pipe(
                filter( ( e ) => e === event ),
                take( 1 )
            ).subscribe( () => {
                resolve();
            } );
        } );
    }
    
    public async play( url: string ) {
        await this.execute( 'loadfile', url, 'replace' );
        await this.waitForEvent( 'playback-restart' );
    }
    
    public async pause() {
        await this.execute( 'set_property', 'pause', true );
    }
    
    public async resume() {
        await this.execute( 'set_property', 'pause', false );
    }
    
    public observeProperty<T>( property: string ): Observable<T> {
        
        return new Observable( ( observer ) => {
            
            this.execute( 'observe_property', 1, property ).then( () => {
                
                // TODO: watch for complete
                
                this.messages.pipe(
                    filter( ( message ) => message.event === 'property-change' ),
                    filter( ( message ) => message.name === property )
                ).subscribe( ( message ) => {
                    observer.next( message.data );
                } );
                
            } ).catch( ( error ) => {
                observer.error( error );
                observer.complete();
            } );
        } );
    }
}