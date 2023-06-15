import { IServerToClientCommand, ZDeviceConfig, ZServerToClientCommand } from '@sync-maestro/shared-interfaces';
import { z } from 'zod';
import { databaseService } from './database.service';
import { socketService } from './socket.service';

export class ClientManagerService {
    
    private clientNameToConfigMap: Map<string, z.infer<typeof ZDeviceConfig>> = new Map();
    
    private readonly defaultConfig = ZDeviceConfig.parse( {
        type    : 'Video',
        device  : 'Monitor',
        name    : 'Unnamed Device',
        offset  : 0,
        channels: [],
        video   : {
            codec      : 'H.264 / AVC',
            container  : 'Mp4',
            compression: 'UnnoticeableCompression',
            fit        : 'ContainImage',
            resolution : '1080p'
        }
    } as z.infer<typeof ZDeviceConfig> );
    
    constructor() {
        socketService.clientNameConnectedSubject.subscribe( ( id ) => this.onClientConnect( id ) );
        socketService.clientNameDisconnectedSubject.subscribe( ( id ) => this.onClientDisconnect( id ) );
        socketService.clientNameMessageSubject.subscribe( ( message ) => this.onClientMessage( message[ 0 ], message[ 1 ] ) );
    }
    
    private async onClientConnect( name: string ) {
        
        const config = ZDeviceConfig.safeParse(
            await databaseService.get( name )
        );
        
        if ( config.success ) {
            this.clientNameToConfigMap.set( name, config.data );
        } else {
            this.clientNameToConfigMap.set( name, this.defaultConfig );
            await databaseService.set( name, this.clientNameToConfigMap.get( name ) );
        }
    }
    
    private onClientDisconnect( name: string ) {
        this.clientNameToConfigMap.delete( name );
    }
    
    private onClientMessage( name: string, message: string ) {
        
        if ( message === 'ready-for-takeoff' ) {
        
        }
    }
    
    public get clientNameWithControllers() {
        
        const result: [
            string, {
                pause: ( be_at?: number, url?: string ) => void,
                resume: ( macro: number, micro: number ) => void,
            }
        ][] = [];
        
        for ( const [ name, ws ] of socketService.registeredClientNameToSocketMap.entries() ) {
            
            result.push( [
                name,
                {
                    pause: ( be_at?: number, url?: string ) => {
                        
                        if ( ( be_at !== undefined && url === undefined ) || ( be_at === undefined && url !== undefined ) ) {
                            throw new Error( 'be_at and url must be both defined or both undefined' );
                        }
                        
                        let cmd: IServerToClientCommand;
                        
                        if ( be_at === undefined && url === undefined ) {
                            
                            cmd = ZServerToClientCommand.parse( {
                                type: 'PauseNow'
                            } as IServerToClientCommand );
                            
                        } else {
                            
                            cmd = ZServerToClientCommand.parse( {
                                type: 'PauseNowAt',
                                be_at,
                                url
                            } as IServerToClientCommand );
                        }
                        
                        ws.send( JSON.stringify( cmd ) );
                    },
                    
                    resume: ( macro: number, micro: number ) => {
                        
                        const cmd = ZServerToClientCommand.parse( {
                            type: 'ResumeWhen',
                            macro,
                            micro
                        } as IServerToClientCommand );
                        
                        ws.send( JSON.stringify( cmd ) );
                    }
                }
            ] );
        }
        
        return result;
    }
    
    public get clientNameWithConfigs() {
        return Array.from( this.clientNameToConfigMap.entries() );
    }
    
    public async changeDevice( name: string, config: z.infer<typeof ZDeviceConfig> ) {
        this.clientNameToConfigMap.set( name, config );
        await databaseService.set( name, config );
    }
}

export const clientManagerService = new ClientManagerService();