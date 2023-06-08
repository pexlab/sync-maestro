import { ZDeviceConfig } from '@sync-maestro/shared-interfaces';
import { z } from 'zod';
import { databaseService } from './database.service';
import { socketService } from './socket.service';

export class ClientManagerService {
    
    private clients: Map<string, z.infer<typeof ZDeviceConfig>> = new Map();
    
    private readonly defaultConfig = ZDeviceConfig.parse( {
        type    : 'Audio',
        device  : 'WiredSpeaker',
        name    : 'Unnamed Device',
        offset  : 0,
        channels: [],
        audio   : {
            codec      : 'Opus',
            compression: '64KbpsBitrate',
            container  : 'Ogg'
        }
    } as z.infer<typeof ZDeviceConfig> );
    
    constructor() {
        socketService.clientConnected.subscribe( ( id ) => this.onClientConnect( id ) );
        socketService.clientDisconnected.subscribe( ( id ) => this.onClientDisconnect( id ) );
    }
    
    private async onClientConnect( id: string ) {
        
        const config = ZDeviceConfig.safeParse(
            await databaseService.get( id )
        );
        
        if ( config.success ) {
            this.clients.set( id, config.data );
        } else {
            this.clients.set( id, this.defaultConfig );
            await databaseService.set( id, this.clients.get( id ) );
        }
    }
    
    private onClientDisconnect( id: string ) {
        this.clients.delete( id );
    }
    
    public get clientList() {
        return Array.from( this.clients.entries() );
    }
    
    public async changeDevice( id: string, config: z.infer<typeof ZDeviceConfig> ) {
        this.clients.set( id, config );
        await databaseService.set( id, config );
    }
}

export const clientManagerService = new ClientManagerService();