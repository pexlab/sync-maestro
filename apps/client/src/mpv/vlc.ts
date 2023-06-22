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
            while ( !( await this.vlc.isPlaying() ) ) {
                await new Promise<void>( resolve => setTimeout( () => resolve(), 1000 ) );
                await this.vlc.play();
            }
            await this.vlc.pause();
            await this.vlc.setTime( 0 );
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