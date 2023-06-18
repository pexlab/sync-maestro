import { ZClientToControlCommand } from '@sync-maestro/shared-interfaces';
import { parseZodFromJSON } from '@sync-maestro/shared-utils';
import { WebSocketServer } from 'ws';
import { instructor } from './main';

export class ControlSocket {
    
    public socketServer = new WebSocketServer( { port: 3002 } );
    
    public constructor() {
        
        this.socketServer.on( 'connection', ( ws ) => {
            
            ws.on( 'message', ( message ) => {
                
                const command = parseZodFromJSON( ZClientToControlCommand, message.toString() );
                
                switch ( command.type ) {
                    
                    case 'Resume':
                        instructor.resume();
                        break;
                    
                    case 'Pause':
                        instructor.pause();
                        break;
                    
                    case 'Next':
                        instructor.next();
                        break;
                    
                    case 'Previous':
                        instructor.prev();
                        break;
                    
                    case 'Scrub':
                        instructor.scrub( command.be_at );
                        break;
                }
            } );
        } );
    }
}