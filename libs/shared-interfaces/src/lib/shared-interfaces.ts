import { spawnSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';

export const ZCommand = z.object( {
    at_macro_tick: z.number(),
    at_micro_tick: z.number(),
    type         : z.enum( [ 'Video' ] ),
    media        : z.object( {
        state: z.enum( [ 'Playing', 'Paused' ] ),
        url  : z.string(),
        be_at: z.number()
    } )
} );

export const ZTransformedCommand = z.union( [
    
    z.object( {
        action       : z.literal( 'load_url_pause_and_seek' ),
        at_macro_tick: z.number(),
        at_micro_tick: z.number(),
        url          : z.string(),
        to_position  : z.number()
    } ),
    
    z.object( {
        action       : z.literal( 'pause_and_seek' ),
        at_macro_tick: z.number(),
        at_micro_tick: z.number(),
        to_position  : z.number()
    } ),
    
    z.object( {
        action       : z.literal( 'resume' ),
        at_macro_tick: z.number(),
        at_micro_tick: z.number()
    } )
] );

export const ZGreeting = z.object( {
    type: z.literal( 'Greeting' ),
    data: z.object( {
        identifier: z.string()
    } )
} );

export const ZVideoDevice = z.enum( [
    'Desktop',
    'Laptop',
    'Tablet',
    'MobilePhone',
    'Television',
    'Projector',
    'Monitor',
    'VirtualReality',
    'CarDisplay'
] );

export const ZAudioDevice = z.enum( [
    'WiredSpeaker',
    'WirelessSpeaker',
    'WiredHeadphone',
    'WirelessHeadphone',
    'CarAudio'
] );

export const ZDevice = z.enum( [
    ...ZVideoDevice.options,
    ...ZAudioDevice.options
] );

export const ZFilter = z.object( {
    type     : z.enum( [
        'LowShelf',
        'HighShelf',
        'Peaking'
    ] ),
    frequency: z.number().min( 20 ).max( 20000 ),
    gain     : z.number().min( -12 ).max( 12 ),
    bandwidth: z.number().min( 0.1 ).max( 12 )
} );

export const ZDeviceConfig = z.object( {
    
    name    : z.string(),
    channels: z.string().array(),
    offset  : z.number()
    
} ).and( z.union( [
    
    z.object( {
        
        type: z.literal( 'Video' ),
        
        device: ZVideoDevice,
        
        video: z.object( {
            
            resolution: z.enum( [
                '4k',
                '1080p',
                '720p',
                '480p'
            ] ),
            
            fit: z.enum( [
                'ContainImage',
                'StretchImage',
                'FillScreen'
            ] )
            
        } ).and( z.union( [
                
                z.object( {
                    codec      : z.literal( 'H.264 / AVC' ),
                    compression: z.enum( [ 'Raw', 'UnnoticeableCompression', 'StrongCompression' ] ),
                    container  : z.enum( [ 'Mp4', 'Mkv', 'Avi', 'Mov' ] )
                } ),
                
                z.object( {
                    codec      : z.literal( 'H.265 / HEVC' ),
                    compression: z.enum( [ 'Raw', 'UnnoticeableCompression', 'StrongCompression' ] ),
                    container  : z.enum( [ 'Mp4', 'Mkv', 'Avi', 'Mov' ] )
                } ),
                
                z.object( {
                    codec      : z.literal( 'VP9' ),
                    compression: z.enum( [ 'Raw', 'UnnoticeableCompression', 'StrongCompression' ] ),
                    container  : z.enum( [ 'WebM', 'Mkv' ] )
                } ),
                
                z.object( {
                    codec      : z.literal( 'AV1' ),
                    compression: z.enum( [ 'Raw', 'UnnoticeableCompression', 'StrongCompression' ] ),
                    container  : z.enum( [ 'Mp4', 'Mkv', 'Avi', 'WebM' ] )
                } )
            ] )
        )
    } ),
    
    z.object( {
        
        type: z.literal( 'Audio' ),
        
        device: ZAudioDevice,
        
        audio: z.object( {
            
            equalization: z.object( {
                amplification: z.number().min( -12 ).max( 12 ),
                filters      : ZFilter.array().min( 1 ).max( 10 )
            } ).optional()
            
        } ).and( z.union( [
                
                z.object( {
                    compression: z.literal( 'Raw' ),
                    codec      : z.literal( 'Flac' ),
                    container  : z.enum( [ 'Flac', 'Mkv', 'Wav' ] )
                } ),
                
                z.object( {
                    compression: z.enum( [ '64KbpsBitrate', '80KbpsBitrate', '128KbpsBitrate' ] ),
                    codec      : z.enum( [ 'Opus' ] ),
                    container  : z.enum( [ 'WebM', 'Mkv', 'Ogg' ] )
                } ),
                
                z.object( {
                    compression: z.enum( [ 'CompressionLevel3', 'CompressionLevel6', 'CompressionLevel12' ] ),
                    codec      : z.enum( [ 'Flac' ] ),
                    container  : z.enum( [ 'Flac' ] )
                } )
            ] )
        )
    } )
] ) );

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

export const ZRegisteredDevice = ZDeviceConfig.and( z.object( {
    identifier: z.string()
} ) );

//TODO: Auslagern

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
    
    const duration       = +spawnSync( 'ffprobe', ffmpegArgs ).stdout.toString();
    const duration_micro = Math.round( duration * 1000 / 10 );
    
    return {
        ...obj,
        duration,
        duration_micro
    };
} );

export type IPlaylist = z.infer<typeof ZPlaylist>;
export type IMedia = z.infer<typeof ZMedia>;
export type IMediaPlaylist = z.infer<typeof ZMediaPlaylist>;
export type IStatus = z.infer<typeof ZStatus>;
export type IState = z.infer<typeof ZState>;

export const ZMediaPlaylist = z.object( {
    duration   : z.number(),
    shuffle    : z.boolean(),
    playlist_id: z.number()
} );

export const ZPlaylist = z.object( {
    id   : z.number(),
    name : z.string(),
    media: /*ZMedia.or(ZMediaPlaylist).array()*/ ZMedia.array()
} );

export const ZState = z.enum( [
    'Playing',
    'Paused',
    'WaitingForTakeOff'
] );

export const ZStatus = z.object( {
    playlist     : ZPlaylist,
    state        : ZState,
    media_index  : z.number(),
    media_runtime: z.number()
} );