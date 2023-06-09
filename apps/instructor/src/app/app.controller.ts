import { Body, Controller, Get, OnModuleDestroy, OnModuleInit, Post } from '@nestjs/common';
import { ZDeviceConfig, ZRegisteredDevice } from '@sync-maestro/shared-interfaces';
import { z } from 'zod';
import { Instructor } from './instructor';
import { clientManagerService } from './services/client-manager.service';
import { socketService } from './services/socket.service';

@Controller()
export class AppController implements OnModuleDestroy, OnModuleInit {
    
    constructor() {
    }
    
    public onModuleInit(): any {
        //new Instructor();
    }
    
    @Get( 'devices' )
    public getDevices() {
        
        const result: z.infer<typeof ZRegisteredDevice>[] = [];
        
        clientManagerService.clientList.forEach( ( client ) => {
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
        await socketService.close();
    }
}
