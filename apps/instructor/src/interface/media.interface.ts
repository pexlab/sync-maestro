import { spawnSync } from 'child_process';
import os from 'os';
import path from 'path';
import { z } from 'zod';
import { Bazaar } from "../util/bazaar.util";

export const ZMedia = z.object( {
    name     : z.string(),
    file_path: z.string()
} ).transform( ( obj ) => {

    const ffmpegArgs = [
        '-v', 'error',
        '-show_entries',
        'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        path.join( os.homedir(), obj.file_path )
    ];

    const duration       = +spawnSync(
      Bazaar.isWindows ?
      Bazaar.getResource( 'binary', 'ffprobe.exe' ) :
      'ffprobe',
      ffmpegArgs ).stdout.toString();
    const duration_micro = Math.round( duration * 1000 / 10 );

    return {
        ...obj,
        duration,
        duration_micro
    };
} );

export type IMedia = z.infer<typeof ZMedia>;

export const ZMediaPlaylist = z.object( {
    duration   : z.number(),
    shuffle    : z.boolean(),
    playlist_id: z.number()
} );

export type IMediaPlaylist = z.infer<typeof ZMediaPlaylist>;

export const ZPlaylist = z.object( {
    id   : z.number(),
    name : z.string(),
    media: /*ZMedia.or(ZMediaPlaylist).array()*/ ZMedia.array()
} );

export type IPlaylist = z.infer<typeof ZPlaylist>;

export const ZState = z.enum( [
    'Playing',
    'Paused',
    'WaitingForTakeOff'
] );

export type IState = z.infer<typeof ZState>;

export const ZStatus = z.object( {
    playlist     : ZPlaylist,
    state        : ZState,
    media_index  : z.number(),
    media_runtime: z.number()
} );

export type IStatus = z.infer<typeof ZStatus>;
