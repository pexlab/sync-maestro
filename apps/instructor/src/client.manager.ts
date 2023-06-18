import { IDeviceConfig, ZClientToServerCommand, ZDeviceConfig, ZServerToClientCommand } from '@sync-maestro/shared-interfaces';
import { ObservableMap, parseZod, parseZodFromJSON } from '@sync-maestro/shared-utils';
import { logClient } from './util/logger.util';
import { clientSocket, databaseManager } from './main';

export class ClientManager {
    
    public clientNameToConfigMap: Map<string, IDeviceConfig>           = new Map();
    public clientNameToReadyForTakeoff: ObservableMap<string, boolean> = new ObservableMap();
    
    private readonly defaultConfig = parseZod( ZDeviceConfig, {
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
    } );
    
    constructor() {
        clientSocket.connectedSubject.subscribe( ( name ) => this.onClientConnect( name ) );
        clientSocket.disconnectedSubject.subscribe( ( name ) => this.onClientDisconnect( name ) );
        clientSocket.messageSubject.subscribe( ( message ) => this.onClientMessage( message[ 0 ], message[ 1 ] ) );
    }
    
    private async onClientConnect( name: string ) {
        
        const config = ZDeviceConfig.safeParse(
            await databaseManager.get( name )
        );
        
        if ( config.success ) {
            this.clientNameToConfigMap.set( name, config.data );
        } else {
            this.clientNameToConfigMap.set( name, this.defaultConfig );
            await databaseManager.set( name, this.clientNameToConfigMap.get( name ) );
        }
        
        logClient(
            'neutral', [undefined, name ],
            'Client successful registered'
        );
        
        this.clientNameToReadyForTakeoff.set( name, false );
    }
    
    private onClientDisconnect( name: string ) {
        this.clientNameToConfigMap.delete( name );
        this.clientNameToReadyForTakeoff.delete( name );
    }
    
    private onClientMessage( name: string, message: string ) {
        
        const command = parseZodFromJSON( ZClientToServerCommand, message );
        
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
        
        for ( const [ name, ws ] of clientSocket.nameToSocketMap.entries() ) {
            
            result.push( [
                name,
                {
                    pause: ( be_at: number, url: string ) => {
                        
                        this.clientNameToReadyForTakeoff.set( name, false );
                        
                        const cmd = parseZod( ZServerToClientCommand, {
                            type: 'PauseImmediatelyAt',
                            be_at,
                            url
                        } );
                        
                        ws.send( JSON.stringify( cmd ) );
                        
                        logClient(
                            'neutral', [ undefined, name ],
                            'Sent: ' + JSON.stringify( cmd )
                        );
                    },
                    
                    resume: ( macro: number, micro: number ) => {
                        
                        const cmd = parseZod( ZServerToClientCommand, {
                            type: 'ResumeWhen',
                            macro,
                            micro
                        } );
                        
                        ws.send( JSON.stringify( cmd ) );
                        
                        logClient(
                            'neutral', [ undefined, name ],
                            'Sent: ' + JSON.stringify( cmd )
                        );
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
        await databaseManager.set( name, config );
    }
}