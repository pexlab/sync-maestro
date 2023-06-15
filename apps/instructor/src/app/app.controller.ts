import { Body, Controller, Get, OnModuleDestroy, Post } from '@nestjs/common';
import { ZDeviceConfig, ZRegisteredDevice } from '@sync-maestro/shared-interfaces';
import { z } from 'zod';
import { clientManagerService } from './services/client-manager.service';
import { socketService } from './services/socket.service';

@Controller()
export class AppController implements OnModuleDestroy {
    
    constructor() {
    }
    
    @Get( 'devices' )
    public getDevices() {
        
        const result: z.infer<typeof ZRegisteredDevice>[] = [];
        
        clientManagerService.clientNameWithConfigs.forEach( ( client ) => {
            result.push( {
                identifier: client[ 0 ],
                ...client[ 1 ]
            } );
        } );
        
        return result;
    }
    
    @Post( 'device' )
    public async changeDevice( @Body() body: {
        identifier: string;
        config: z.infer<typeof ZDeviceConfig>;
    } ) {
        
        const parsed = ZDeviceConfig.parse( body.config );
        
        await clientManagerService.changeDevice( body.identifier, parsed );
    }
    
    public async onModuleDestroy() {
        await socketService.closeServer();
    }
}
