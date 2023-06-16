import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { z } from 'zod';
import { Bazaar, logger } from '../util';

export class MpvProcess {
    
    public prepare( config: IMpvInternalConfiguration ) {
        
        logger.mpvProcess.log( 'Preparing mpv process...' );
        
        config = ZMpvInternalConfiguration.parse( config );
        
        const shaders = config.shaders.map( shader => {
            return '--glsl-shader=' + Bazaar.getResource( 'shader', shader );
        } );
        
        logger.mpvProcess.log( 'Preparation completed' );
        
        let process: ChildProcessWithoutNullStreams | undefined = undefined;
        
        let restartOnClose = true;
        
        const open = () => {
            
            if ( process ) {
                logger.mpvProcess.log( 'Process already running. Aborting' );
                return;
            }
            
            restartOnClose = true;
            
            logger.mpvProcess.log( 'Spawning mpv process...' );
            
            process = spawn(
                Bazaar.isWindows ?
                Bazaar.getResource( 'binary', 'mpv.exe' ) :
                'mpv',
                [
                    '--idle',
                    '--fullscreen',
                    '--force-window',
                    '--ontop',
                    '--no-osc',
                    '--log-file=mpv.log',
                    '--input-ipc-server=' + config.ipc,
                    ...shaders
                ]
            );
            
            logger.mpvProcess.log( 'Process spawned' );
            
            process.on( 'close', ( code ) => {
                
                logger.mpvProcess.warn( `Exited with code ${ code }` );
                
                process = undefined;
                
                if ( restartOnClose ) {
                    logger.mpvProcess.log( 'Restarting...' );
                    open();
                }
            } );
        };
        
        const close = () => {
            restartOnClose = false;
            process?.kill();
        };
        
        const isRunning = () => {
            return !!process;
        };
        
        return { open, close, isRunning };
    }
}

export const ZMpvConfiguration = z.object( {
    screen : z.number().min( 0 ).int(),
    shaders: z.string().nonempty().array()
} );

export type IMpvConfiguration = z.infer<typeof ZMpvConfiguration>;

export const ZMpvInternalConfiguration = ZMpvConfiguration.extend( {
    ipc: z.string().nonempty()
} );

export type IMpvInternalConfiguration = z.infer<typeof ZMpvInternalConfiguration>;