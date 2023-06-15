import net from 'net';
import { filter, Subject, take } from 'rxjs';
import { logger } from '../util';

export class MpvSocket {
    
    public prepare( ipc: string ) {
        
        logger.mpvSocket.log( 'Preparing mpv socket...' );
        
        let active = false;
        
        let socket: net.Socket | undefined;
        
        const messageSubject = new Subject<Record<string, any>>();
        const eventSubject   = new Subject<string>();
        
        const writeQueue: string[] = [];
        
        setInterval( async () => {
            
            if ( active && !socket ) {
                
                try {
                    
                    const tmpSocket = net.createConnection( ipc );
                    
                    await new Promise<void>( ( resolve, reject ) => {
                        
                        tmpSocket.on( 'connect', () => {
                            
                            tmpSocket.on( 'data', ( data ) => {
                                
                                const messages = data.toString().split( '\n' ).filter( Boolean );
                                
                                for ( const message of messages ) {
                                    
                                    try {
                                        
                                        const messageObject = JSON.parse( message );
                                        
                                        messageSubject.next( messageObject );
                                        
                                        if ( messageObject.event && typeof messageObject.event === 'string' ) {
                                            eventSubject.next( messageObject.event );
                                        }
                                        
                                    } catch ( e ) {
                                        logger.mpvSocket.error( [ 'Error parsing message: ', message ] );
                                    }
                                }
                            } );
                            
                            resolve();
                        } );
                        
                        tmpSocket.on( 'error', ( err ) => {
                            reject( err );
                        } );
                        
                        tmpSocket.on( 'close', () => {
                            socket = undefined;
                        } );
                        
                    } );
                    
                    socket = tmpSocket;
                    
                    logger.mpvSocket.log( 'Connected established' );
                    
                    if ( writeQueue.length > 0 ) {
                        
                        logger.mpvSocket.log( 'Writing queued messages...' );
                        
                        for ( const message of writeQueue ) {
                            socket.write( message );
                        }
                        
                        logger.mpvSocket.log( 'Written ' + writeQueue.length + ' queued messages' );
                        
                        writeQueue.length = 0;
                    }
                    
                } catch ( ignored ) {
                    /* Retry until success */
                }
            }
        }, 50 );
        
        const connect = () => {
            logger.mpvSocket.log( 'Connecting to socket...' );
            active = true;
        };
        
        const disconnect = () => {
            logger.mpvSocket.log( 'Disconnecting from socket...' );
            active = false;
            socket?.destroy();
            logger.mpvSocket.log( 'Disconnected from socket' );
        };
        
        let lastRequestId = NaN;
        
        const sendRequest = <T>( command: string, ...params: unknown[] ): Promise<{ took: number, data: T }> => {
            
            const id = isNaN( lastRequestId ) ? lastRequestId = 0 : ++lastRequestId;
            
            const message = {
                request_id: id,
                command   : [ command, ...params ]
            };
            
            if ( !socket || !socket.writable ) {
                
                writeQueue.push(
                    JSON.stringify( message ) +
                    '\n'
                );
                
                logger.mpvSocket.log( 'Socket not writable, request (id-' + id + ') queued' );
                
            } else {
                
                socket.write(
                    JSON.stringify( message ) +
                    '\n'
                );
            }
            
            const writeEnd = performance.now();
            
            return new Promise<{ took: number, data: T }>( ( resolve, reject ) => {
                messageSubject.pipe(
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
        };
        
        const waitForEvent = ( event: string ): Promise<void> => {
            return new Promise<void>( ( resolve ) => {
                eventSubject.pipe(
                    filter( ( e ) => e === event ),
                    take( 1 )
                ).subscribe( () => {
                    resolve();
                } );
            } );
        };
        
        logger.mpvSocket.log( 'Preparation completed' );
        
        return {
            connect,
            disconnect,
            sendRequest,
            waitForEvent,
            messages: messageSubject,
            events  : eventSubject
        };
    }
}