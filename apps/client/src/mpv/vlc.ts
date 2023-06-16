import * as VLC from 'vlc-client';

export class Vlc {
    
    private readonly vlc;
    
    constructor() {
        this.vlc = new VLC.Client( {
            ip      : 'localhost',
            port    : 8080,
            password: 'sync-maestro'
        } );
    }
    
    public readonly control = {
        
        loadFile: async ( url: string ) => {
            await this.vlc.playFile( url );
            await this.vlc.pause();
        },
        
        pause_at: async ( absoluteTimeInSec: number ) => {
            await this.vlc.pause();
            await this.vlc.setTime( absoluteTimeInSec );
        },
        
        resume: async () => {
            await this.vlc.play();
        }
    };
}