import { SimulateAdapter } from '@sync-maestro/shared-utils';
import * as path from 'path';
import { logMPV } from './logger';
import { MPV } from './mpv';

export class Obeyer {
    
    private mpv   = new MPV();
    private timer = new SimulateAdapter();
    
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
    
    public onRequest(request: any) {}
}