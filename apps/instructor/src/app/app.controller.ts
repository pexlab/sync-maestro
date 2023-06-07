import { Controller, Get, OnModuleDestroy } from '@nestjs/common';
import { clientManagerService } from './services/client-manager.service';
import { socketService } from './services/socket.service';

@Controller()
export class AppController implements OnModuleDestroy {
    
    constructor( ) {
    }
    
    @Get('clients')
    public getClients() {
        return clientManagerService.clientList;
    }
    
    public async onModuleDestroy() {
        await socketService.close();
    }
}
