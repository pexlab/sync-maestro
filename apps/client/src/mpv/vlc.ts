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
            console.log('playFile (loadFile)', url);
            await this.vlc.playFile( url );
            console.log('pause (loadFile)');
            await this.vlc.pause();
        },
        
        pause_at: async ( absoluteTimeInSec: number ) => {
            console.log('pause (pause_at)');
            await this.vlc.pause();
            console.log('setTime (pause_at)', absoluteTimeInSec);
            await this.vlc.setTime( absoluteTimeInSec );
        },
        
        resume: async () => {
            console.log('play (resume)');
            await this.vlc.play();
        }
    };
}