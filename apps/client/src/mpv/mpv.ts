import * as os from 'os';
import * as path from 'path';
import { Bazaar, logger } from '../util';
import { IMpvConfiguration, MpvProcess, ZMpvConfiguration } from './mpv.process';
import { MpvSocket } from './mpv.socket';

export class MPV {
    
    private readonly ipcPath;
    
    private readonly socket;
    
    private readonly process;
    
    private preparedInstance: ReturnType<MpvProcess['prepare']> | undefined;
    
    constructor() {
        
        this.ipcPath = path.join(
            Bazaar.isWindows ? '//./pipe' : '',
            os.tmpdir(), `sync-maestro-mpv-${ Bazaar.uniqueString( 10 ) }.sock`
        );
        
        logger.mpvSocket.log( 'IPC Path: ' + this.ipcPath );
        
        this.socket = new MpvSocket().prepare( this.ipcPath );
        this.socket.connect();
        
        this.process = new MpvProcess();
    }
    
    public initialize( config: IMpvConfiguration ) {
        
        config = ZMpvConfiguration.parse( config );
        
        if ( this.preparedInstance ) {
            this.preparedInstance.close();
            this.preparedInstance = undefined;
        }
        
        this.preparedInstance = this.process.prepare( {
            ...config,
            ipc: this.ipcPath
        } );
        
        this.preparedInstance.open();
    }
    
    public readonly control = {
        
        loadFile: async ( url: string ) => {
            await this.socket.sendRequest( 'loadfile', url, 'replace' );
        },
        
        pause_at: async ( absoluteTimeInSec: number ) => {
            await this.socket.sendRequest( 'set_property', 'pause', true );
            await this.socket.sendRequest( 'seek', String( absoluteTimeInSec ), 'absolute' );
        },
        
        resume: async () => {
            await this.socket.sendRequest( 'set_property', 'pause', false );
        }
    };
}