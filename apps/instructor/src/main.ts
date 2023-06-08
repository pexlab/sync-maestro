import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
    
    const app = await NestFactory.create( AppModule );
    
    app.enableCors( {
        origin: '*'
    } );
    
    const port = 3000;
    
    await app.listen( port );
    
    process.on( 'SIGINT', async () => {
        await app.close();
    } );
}

bootstrap();
