import { ZCommand } from '@sync-maestro/shared-interfaces';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';
import { logMpvProcess } from './logger';
import { timer } from './main';
import { MPV } from './mpv';

export class Obeyer {
    
    private mpv = new MPV();
    
    public commands: z.infer<typeof ZCommand>[] = [];
    
    private currentURL: string | undefined;
    
    constructor() {
        
        this.mpv.connect().then( () => {
            
            this.mpv.messages.subscribe( ( message ) => {
                
                if ( message.event && typeof message.event === 'string' ) {
                    
                    if ( message.event === 'property-change' ) {
                        return;
                    }
                    
                    logMpvProcess.log( message.event );
                    
                } else if ( message.request_id === undefined ) {
                    logMpvProcess.log( message );
                }
            } );
            
            let block = false;
            
            timer.enable();
            
            timer.onTick.subscribe( async () => {
                
                if ( block ) {
                    return;
                }
                
                const macro = timer.currentMacroTick;
                const micro = timer.currentMicroTick;
                
                const currentCommand = this.commands.filter( command => {
                    return command.at_macro_tick === macro; // TODO: Micro as well
                } ).at( -1 );
                
                if ( !currentCommand ) {
                    return;
                }
                
                console.log( currentCommand );
                
                if ( currentCommand.media.url !== this.currentURL ) {
                    
                    block = true;
                    
                    await this.mpv.play( path.join( os.homedir(), currentCommand.media.url ) );
                    await this.mpv.pause();
                    await this.mpv.scrub( currentCommand.media.be_at );
                    
                    this.currentURL = currentCommand.media.url;
                    
                    block = false;
                    
                    return;
                }
                
                if ( currentCommand.media.state === 'Paused' ) {
                    
                    block = true;
                    
                    await this.mpv.pause();
                    await this.mpv.scrub( currentCommand.media.be_at );
                    
                    block = false;
                    
                    return;
                }
                
                block = true;
                
                await this.mpv.resume();
                
                block = false;
            } );
        } );
    }
}
