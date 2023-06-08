import { ZCommand, ZTransformedCommand } from '@sync-maestro/shared-interfaces';
import { SimulateAdapter } from '@sync-maestro/shared-utils';
import * as path from 'path';
import { z } from 'zod';
import { logMPV } from './logger';
import { MPV } from './mpv';

export class Obeyer {
    
    private mpv = new MPV();
    
    private timer = new SimulateAdapter();
    
    private commands: z.infer<typeof ZTransformedCommand>[] = [];
    
    private currentURL: string | undefined;
    private currentPosition: number | undefined;
    private currentMediaState: 'Playing' | 'Paused' | undefined;
    
    constructor() {
        
        this.mpv.connect().then( () => {
            
            this.mpv.messages.subscribe( ( message ) => {
                
                if ( message.event && typeof message.event === 'string' ) {
                    
                    if ( message.event === 'property-change' ) {
                        return;
                    }
                    
                    logMPV.debug( message.event );
                    
                } else if ( message.request_id === undefined ) {
                    logMPV.debug( message );
                }
            } );
            
            this.mpv.play( path.join( process.cwd(), 'demo.mp4' ) ).then( () => {
                
                this.mpv.pause().then( () => {
                    this.mpv.scrub( 200 ).then();
                } );
            } );
            
            this.timer.macroTick.subscribe( macro => {
                if ( macro.tick === 10 ) {
                    this.mpv.resume().then();
                }
            } );
        } );
    }
    
    public setCommands( commands: z.infer<typeof ZCommand>[] ) {
        
        let result: z.infer<typeof ZTransformedCommand>[] = [];
        
        const currentResult = () => {
            return result.length === 0 ? undefined : result[ result.length - 1 ];
        };
        
        const previousResult = () => {
            return result.length < 2 ? undefined : result[ result.length - 2 ];
        };
        
        const tickDistance = ( future: number, type: 'macro' | 'micro' ) => {
            const current = type === 'macro' ? this.timer.currentMacroTick : this.timer.currentMicroTick;
            const diff    = future - current;
            if ( diff >= 0 ) {
                return diff;
            } else {
                return 256 + diff;
            }
        };
        
        const tickToMs = ( macro: number, micro: number ) => {
            return macro * 1000 + micro / 1000;
        }
        
        const getFutureState = () => {
        
        
        }
        
        for ( let i = 0; i < commands.length; i++ ) {
            
            const currentCommand  = commands[ i ];
            const previousCommand = i === 0 ? undefined : commands[ i - 1 ];
            
            if (
                ( !previousCommand || currentCommand.media.url !== previousCommand.media.url ) &&
                this.currentURL !== currentCommand.media.url
            ) {
                result.push(
                    {
                        action       : 'load_url_pause_and_seek',
                        at_macro_tick: currentCommand.at_macro_tick,
                        at_micro_tick: currentCommand.at_micro_tick,
                        url          : currentCommand.media.url,
                        to_position  : currentCommand.media.be_at
                    }
                );
                continue;
            }
            
        }
    }
}