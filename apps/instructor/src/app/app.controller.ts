import { Body, Controller, Get, OnModuleDestroy, Post } from '@nestjs/common';
import { IRegisteredDevice, ZDeviceConfig, ZRegisteredDevice } from '@sync-maestro/shared-interfaces';
import { z } from 'zod';
import { clientManagerService } from './services/client-manager.service';
import { socketService } from './services/socket.service';

@Controller()
export class AppController implements OnModuleDestroy {
    
    @Get( 'devices' )
    public getDevices() {
        
        const result: IRegisteredDevice[] = [];
        
        clientManagerService.clientNameWithConfigs.forEach( ( [ name, config ] ) => {
            
            const readyForTakeoff = clientManagerService.clientNameToReadyForTakeoff.get( name );
            
            if ( readyForTakeoff === undefined ) {
                return;
            }
            
            result.push( {
                ...config,
                name,
                readyForTakeoff
            } );
        } );
        
        return ZRegisteredDevice.array().parse( result );
    }
    
    @Post( 'device' )
    public async changeDevice( @Body() body: {
        name: string;
        config: z.infer<typeof ZDeviceConfig>;
    } ) {
        await clientManagerService.editDeviceConfig(
            body.name,
            ZDeviceConfig.parse( body.config )
        );
    }
    
    public async onModuleDestroy() {
        await socketService.closeServer();
    }
}
