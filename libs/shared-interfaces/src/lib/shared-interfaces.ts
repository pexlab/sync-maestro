import { z } from 'zod';

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