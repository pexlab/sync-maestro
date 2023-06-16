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
            console.log( 'playFile (loadFile)', url );
            await this.vlc.playFile( url );
            while ( !( await this.vlc.isPlaying() ) ) {
                console.log('Waiting for VLC to start playing');
                await new Promise<void>( resolve => setTimeout( () => resolve(), 1000 ) );
                console.log( 'play (loadFile)' );
                await this.vlc.play();
            }
            console.log( 'pause (loadFile)' );
            await this.vlc.pause();
            console.log( 'setTime (loadFile)', 0 );
            await this.vlc.setTime( 0 );
        },
        
        pause_at: async ( absoluteTimeInSec: number ) => {
            console.log( 'pause (pause_at)' );
            await this.vlc.pause();
            console.log( 'setTime (pause_at)', absoluteTimeInSec );
            await this.vlc.setTime( absoluteTimeInSec );
        },
        
        resume: async () => {
            console.log( 'play (resume)' );
            await this.vlc.play();
        }
    };
}