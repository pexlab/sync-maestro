import { ZDeviceConfig } from '@sync-maestro/shared-interfaces';
import { spawn } from 'child_process';
import fs from 'fs';
import { Buffer } from 'node:buffer';
import os from 'os';
import path from 'path';
import { z } from 'zod';

let id = 0;

export function generateEqualized( input: Buffer | string, device: z.infer<typeof ZDeviceConfig> ): void {
    
    if ( device.type !== 'Audio' ) {
        return;
    }
    
    id++;
    
    let inputBuffer: Buffer;
    
    if ( typeof input === 'string' ) {
        inputBuffer = fs.readFileSync( input );
    } else {
        inputBuffer = input;
    }
    
    const inputFilePath  = path.join( os.tmpdir(), `sync-maestro-ffmpeg-input-${ id }` );
    const outputFilePath = path.join( os.tmpdir(), `sync-maestro-ffmpeg-output-${ id }` );
    
    const cleanUp = () => {
        if ( fs.existsSync( inputFilePath ) ) {
            fs.unlinkSync( inputFilePath );
        }
        if ( fs.existsSync( outputFilePath ) ) {
            fs.unlinkSync( outputFilePath );
        }
    };
    
    fs.writeFileSync( inputFilePath, inputBuffer );
    
    /* Base settings */
    
    const ffmpegArgs = [
        '-loglevel', 'error',
        '-stats',
        '-y',
        '-i', inputFilePath,
        '-map_metadata', '-1',
        '-vn'
    ];
    
    /* Codec and quality */
    
    let fileExtension: string;
    
    if ( device.audio.codec === 'Flac' ) {
        
        ffmpegArgs.push( '-codec:a', 'flac' );
        
        switch ( device.audio.compression ) {
            case 'Raw':
                ffmpegArgs.push( '-compression_level', '0' );
                break;
            case 'CompressionLevel3':
                ffmpegArgs.push( '-compression_level', '3' );
                break;
            case 'CompressionLevel6':
                ffmpegArgs.push( '-compression_level', '6' );
                break;
            case 'CompressionLevel12':
                ffmpegArgs.push( '-compression_level', '12' );
                break;
        }
        
        fileExtension = device.audio.container.toLowerCase();
        
    } else if ( device.audio.codec === 'Opus' ) {
        
        ffmpegArgs.push( '-codec:a', 'libopus' );
        
        switch ( device.audio.compression ) {
            case '64KbpsBitrate':
                ffmpegArgs.push( '-b:a', '64k' );
                break;
            case '80KbpsBitrate':
                ffmpegArgs.push( '-b:a', '80k' );
                break;
            case '128KbpsBitrate':
                ffmpegArgs.push( '-b:a', '128k' );
                break;
        }
        
        fileExtension = device.audio.container.toLowerCase();
        
    } else {
        throw new Error( 'Unsupported codec' );
    }
    
    /* Equalizer */
    
    if ( device.audio.equalization ) {
        
        const ffmpegFilters = device.audio.equalization.filters.reduce(
            (
                accumulator,
                filter,
                index,
                array
            ) => {
                
                let ffmpegFilter: string;
                
                switch ( filter.type ) {
                    case 'Peaking':
                        ffmpegFilter = `equalizer=`;
                        break;
                    case 'HighShelf':
                        ffmpegFilter = `highshelf=`;
                        break;
                    case 'LowShelf':
                        ffmpegFilter = `lowshelf=`;
                        break;
                }
                
                ffmpegFilter +=
                    `frequency=${ filter.frequency }:` +
                    `width_type=q:width=${ filter.bandwidth }:` +
                    `gain=${ filter.gain }:` +
                    `normalize=true`;
                
                if ( index === array.length - 1 ) {
                    accumulator += ffmpegFilter;
                } else {
                    accumulator += `${ ffmpegFilter }, `;
                }
                
                return accumulator;
                
            }, `volume=${ device.audio.equalization.amplification }dB, `
        );
        
        ffmpegArgs.push( '-af', ffmpegFilters + ', dynaudnorm' );
    }
    
    /* Saving */
    
    ffmpegArgs.push( `${ outputFilePath }.${ fileExtension }` );
    
    try {
        
        const ffmpegProcess = spawn( 'ffmpeg', ffmpegArgs );
        
        ffmpegProcess.stderr.on( 'data', ( data ) => {
            
            const output = data.toString();
            
            if ( !output.includes( 'time=' ) ) {
                return;
            }
            
            const progressRegex = /time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/;
            const matches       = output.match( progressRegex );
            
            if ( !matches ) {
                return;
            }
            
            const hours        = parseInt( matches[ 1 ], 10 );
            const minutes      = parseInt( matches[ 2 ], 10 );
            const seconds      = parseInt( matches[ 3 ], 10 );
            const milliseconds = parseInt( matches[ 4 ], 10 );
            
            const progressInMs = (
                ( hours * 60 * 60 * 1000 ) +
                ( minutes * 60 * 1000 ) +
                ( seconds * 1000 ) +
                milliseconds
            );
            
            console.log( progressInMs );
        } );
        
    } catch ( error ) {
        console.error( 'Error executing command:', error );
    }
}

// generateEqualized( 'demo.mp4', {
//     type    : 'Audio',
//     name    : 'test',
//     offset  : 0,
//     channels: [ 'test' ],
//     device  : 'WiredSpeaker',
//     audio   : {
//         codec       : 'Opus',
//         compression : '64KbpsBitrate',
//         container   : 'Ogg',
//         equalization: {
//             amplification: -4.4,
//             filters      : [
//                 {
//                     type     : 'Peaking',
//                     frequency: 52,
//                     bandwidth: 0.334,
//                     gain     : 12.8
//                 },
//                 {
//                     'type'     : 'LowShelf',
//                     'frequency': 105,
//                     'bandwidth': 0.700,
//                     'gain'     : 7.7
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 608,
//                     'bandwidth': 0.890,
//                     'gain'     : 0.7
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 1010,
//                     'bandwidth': 2.420,
//                     'gain'     : -0.8
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 1290,
//                     'bandwidth': 2.100,
//                     'gain'     : -1.3
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 1810,
//                     'bandwidth': 4.040,
//                     'gain'     : 1.0
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 2200,
//                     'bandwidth': 3.260,
//                     'gain'     : 1.4
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 5040,
//                     'bandwidth': 2.350,
//                     'gain'     : -4.3
//                 },
//                 {
//                     'type'     : 'Peaking',
//                     'frequency': 9960,
//                     'bandwidth': 0.860,
//                     'gain'     : 4.7
//                 },
//                 {
//                     'type'     : 'HighShelf',
//                     'frequency': 10000,
//                     'bandwidth': 0.700,
//                     'gain'     : -4.7
//                 }
//             ]
//         }
//     }
// } );