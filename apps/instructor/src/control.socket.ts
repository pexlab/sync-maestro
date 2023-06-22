import { IRegisteredDevice, ZClientToControlCommand, ZServerToControllerCommand } from '@sync-maestro/shared-interfaces';
import { parseZod, parseZodFromJSON } from '@sync-maestro/shared-utils';
import { WebSocket, WebSocketServer } from 'ws';
import { clientManager, instructor, timer } from './main';

export class ControlSocket {
    
    public socketServer = new WebSocketServer( { port: 3002 } );
    
    private clients = new Set<WebSocket>();
    
    constructor() {
        
        this.socketServer.on( 'connection', ( ws ) => {
            
            this.clients.add( ws );
            
            ws.on( 'close', () => {
                this.clients.delete( ws );
            } );
            
            ws.on( 'message', async ( message ) => {
                
                const command = parseZodFromJSON( ZClientToControlCommand, message.toString() );
                
                switch ( command.type ) {
                    
                    case 'TogglePlayback':
                        instructor.toggle();
                        break;
                    
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
                        instructor.scrub( command.be_at_percent );
                        break;
                    
                    case 'ConfigureDevice':
                        await clientManager.editDeviceConfig(
                            command.name,
                            command.config
                        );
                        break;
                }
            } );
        } );
        
        setInterval( () => {
            
            const registeredDevices: IRegisteredDevice[] = [];
            
            clientManager.clientNameWithConfigs.forEach( ( [ name, config ] ) => {
                
                const readyForTakeoff = clientManager.clientNameToReadyForTakeoff.get( name );
                
                if ( readyForTakeoff === undefined ) {
                    return;
                }
                
                registeredDevices.push( {
                    ...config,
                    name,
                    readyForTakeoff
                } );
            } );
            
            const command = JSON.stringify(
                parseZod( ZServerToControllerCommand, {
                    
                    type: 'Info',
                    
                    macro                          : timer.currentMacroTick,
                    macro_since_startup            : timer.currentMacroTickSinceStartup,
                    macro_occurrence               : 1000,
                    macro_discrepancy              : 0,
                    macro_since_startup_discrepancy: 0,
                    
                    micro                          : timer.currentMicroTick,
                    micro_since_startup            : timer.currentMicroTickSinceStartup,
                    micro_occurrence               : 10,
                    micro_discrepancy              : 0,
                    micro_since_startup_discrepancy: 0,
                    
                    current_media: {
                        name    : 'Idle',
                        duration: 10000,
                        position: 3500,
                        paused  : true,
                        waiting : false
                    },
                    
                    devices: registeredDevices
                } )
            );
            
            Array.from( this.clients.values() ).forEach( ( ws ) => {
                ws.send( command );
            } );
            
        }, 1000 );
    }
}