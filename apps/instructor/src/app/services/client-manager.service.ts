import { IDeviceConfig, IServerToClientCommand, ZClientToServerCommand, ZDeviceConfig, ZServerToClientCommand } from '@sync-maestro/shared-interfaces';
import { ObservableMap, parseJSON } from '@sync-maestro/shared-utils';
import { z } from 'zod';
import { log } from '../logger';
import { databaseService } from './database.service';
import { socketService } from './socket.service';

export class ClientManagerService {
    
    public clientNameToConfigMap: Map<string, z.infer<typeof ZDeviceConfig>> = new Map();
    public clientNameToReadyForTakeoff: ObservableMap<string, boolean>       = new ObservableMap();
    
    private readonly defaultConfig = ZDeviceConfig.parse( {
        type       : 'Video',
        device     : 'Monitor',
        displayName: 'Unnamed Device',
        offset     : 0,
        channels   : [],
        video      : {
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
        
        this.clientNameToReadyForTakeoff.set( name, false );
    }
    
    private onClientDisconnect( name: string ) {
        this.clientNameToConfigMap.delete( name );
        this.clientNameToReadyForTakeoff.delete( name );
    }
    
    private onClientMessage( name: string, message: string ) {
        
        const command = ZClientToServerCommand.parse( parseJSON( message ) );
        
        switch ( command.type ) {
            
            case 'ReadyForTakeoff':
                this.clientNameToReadyForTakeoff.set( name, command.state );
                break;
        }
    }
    
    public get clientNameWithControllers() {
        
        const result: [
            string, {
                pause: ( be_at: number, url: string ) => void,
                resume: ( macro: number, micro: number ) => void,
            }
        ][] = [];
        
        for ( const [ name, ws ] of socketService.registeredClientNameToSocketMap.entries() ) {
            
            result.push( [
                name,
                {
                    pause: ( be_at: number, url: string ) => {
                        
                        this.clientNameToReadyForTakeoff.set( name, false );
                        
                        const cmd = ZServerToClientCommand.parse( {
                            type: 'PauseImmediatelyAt',
                            be_at,
                            url
                        } as IServerToClientCommand );
                        
                        ws.send( JSON.stringify( cmd ) );
                        
                        log.log( 'Sent to (name-' + name + '): ' + JSON.stringify( cmd ) );
                    },
                    
                    resume: ( macro: number, micro: number ) => {
                        
                        const cmd = ZServerToClientCommand.parse( {
                            type: 'ResumeWhen',
                            macro,
                            micro
                        } as IServerToClientCommand );
                        
                        ws.send( JSON.stringify( cmd ) );
                        
                        log.log( 'Sent to (name-' + name + '): ' + JSON.stringify( cmd ) );
                    }
                }
            ] );
        }
        
        return result;
    }
    
    public get clientNameWithConfigs() {
        return Array.from( this.clientNameToConfigMap.entries() );
    }
    
    public async editDeviceConfig( name: string, config: IDeviceConfig ) {
        this.clientNameToConfigMap.set( name, config );
        await databaseService.set( name, config );
    }
}

export const clientManagerService = new ClientManagerService();