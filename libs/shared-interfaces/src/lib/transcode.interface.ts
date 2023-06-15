import { z } from 'zod';
import { ZDevice } from './device.interface';

export const ZTranscodeJob = z.object( {
    job        : z.literal( 'Transcode' ),
    type       : z.enum( [
        'Video',
        'Audio'
    ] ),
    device     : ZDevice,
    started_ago: z.number(),
    progress   : z.number().min( 0 ).max( 1 )
} );

export const ZJob = z.union( [
    
    ZTranscodeJob,
    
    z.object( {
        job: z.literal( 'Audio' )
    } )
] );