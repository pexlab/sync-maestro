import { select } from '@inquirer/prompts';
import { Timer } from '@sync-maestro/shared-utils';
import process from 'process';
import { SerialPort } from 'serialport';
import { SerialTimer } from 'shared-backend-utils';
import YAML from 'yaml';
import { ClientManager } from './client.manager';
import { ClientSocket } from './client.socket';
import { ControlSocket } from './control.socket';
import { DatabaseManager } from './database.manager';
import { Instructor } from './instructor';
import { logMessage } from './util/logger.util';

export let databaseManager!: DatabaseManager;

export let timer!: Timer;

export let clientSocket!: ClientSocket;

export let clientManager!: ClientManager;

export let instructor!: Instructor;

export let controlSocket!: ControlSocket;

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
    
    databaseManager = new DatabaseManager();
    
    timer = new SerialTimer( port , {
        handleFaultyTick: 'Replace',
        macroDiscrepancy: {
            exceedThreshold: {
                disable: 0,
                warning: 0,
                error: 0
            },
            undercutThreshold:{
                disable: 0,
                warning: 0,
                error: 0
            }
        },
        microDiscrepancy: {
            exceedThreshold: {
                disable: 0,
                warning: 0,
                error: 0
            },
            undercutThreshold:{
                disable: 0,
                warning: 0,
                error: 0
            }
        }
    });
    
    clientSocket = new ClientSocket();
    
    clientManager = new ClientManager();
    
    instructor = new Instructor();
    
    controlSocket = new ControlSocket();
    
    process.on( 'SIGINT', async () => {
        logMessage( 'Shutting down...' );
        await clientSocket.shutdownAndUnpublish();
        logMessage( 'Shutdown completed. Exiting...' );
        process.exit( 0 );
    } );
}

bootstrap();
