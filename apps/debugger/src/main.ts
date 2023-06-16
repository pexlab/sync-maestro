import * as os from 'os';
import * as path from 'path';
import * as VLC from 'vlc-client';

async function boostrap() {
    
    const vlc = new VLC.Client( {
        ip      : 'localhost',
        port    : 8080,
        password: 'sync-maestro'
    } );
    
    await vlc.playFile( path.join( os.homedir(), 'four.mp4' ) );
    await vlc.pause();
    await vlc.setTime(5);
    await vlc.play();
}

boostrap().then();
