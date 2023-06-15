import { select } from '@inquirer/prompts';
import { NestFactory } from '@nestjs/core';
import { Timer } from '@sync-maestro/shared-interfaces';
import { SerialTimer } from '@sync-maestro/shared-utils';
import { SerialPort } from 'serialport';
import YAML from 'yaml';

import { AppModule } from './app/app.module';

export let timer!: Timer;

async function bootstrap() {
    
    const ports = await SerialPort.list();
    
    const port = await select( {
        message: 'Select a port',
        choices: ports.map( ( port ) => {
            return {
                name       : port.path,
                description: '\n<-- Information about that port -->\n\n' + YAML.stringify( port ),
                value      : port.path
            };
        } )
    } );
    
    timer = new SerialTimer( port );
    
    const app = await NestFactory.create( AppModule );
    
    app.enableCors( {
        origin: '*'
    } );
    
    await app.listen( 3000 );
    
    process.on( 'SIGINT', async () => {
        await app.close();
    } );
}

bootstrap();
