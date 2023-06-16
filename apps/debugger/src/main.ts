import * as os from 'os';
import * as path from 'path';
import * as VLC from 'vlc-client';

async function boostrap() {
    
    const vlc = new VLC.Client( {
        ip      : 'localhost',
        port    : 8080,
        password: 'sync-maestro'
    } );
    
    let count = 0;
    
    await vlc.playFile( path.join( os.homedir(), 'four.mp4' ) );
    
    console.log('play');
    
    while ( true ) {
        
        vlc.play().then();
        count++;
        
        if ( count > 1000 ) {
            console.log('done');
            break;
        }
    }
}

boostrap().then();
