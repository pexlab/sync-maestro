import { z } from 'zod';

export const ZVideoDevice = z.enum( [
    'Desktop',
    'Laptop',
    'Tablet',
    'Phone',
    'TV',
    'Projector',
    'Monitor',
    'VirtualReality',
    'CarDisplay'
] );

export const ZAudioDevice = z.enum( [
    'WiredSpeaker',
    'WirelessSpeaker',
    'WiredHeadphones',
    'WirelessHeadphones',
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
    
    name: z.string()
    
} ).and( z.union( [
    
    z.object( {
        
        type: z.literal( 'Video' ),
        
        device: ZVideoDevice,
        
        bitrate: z.enum( [
            'Ultra',
            'High',
            'Medium',
            'Low'
        ] ),
        
        resolution: z.enum( [
            '4k',
            '1080p',
            '720p',
            '480p'
        ] ),
        
        fit: z.enum( [
            'Contain',
            'Cover'
        ] )
    } ),
    
    z.object( {
        
        type: z.literal( 'Audio' ),
        
        device: ZAudioDevice,
        
        bitrate: z.enum( [
            'Compressed',
            'Lossless'
        ] ),
        
        equalize: z.object( {
            preamp : z.number().min( -12 ).max( 12 ),
            filters: ZFilter.array().min( 1 ).max( 10 )
        } ).optional()
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