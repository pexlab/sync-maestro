import { Injectable } from '@nestjs/common';
import { ZDeviceConfig } from '@sync-maestro/shared-interfaces';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { Buffer } from 'node:buffer';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';

@Injectable()
export class AppService {
    
    private id = 0;
    
    public generateEqualized( input: Buffer | string, device: z.infer<typeof ZDeviceConfig> ): void {
        
        if ( device.type !== 'Audio' ) {
            return;
        }
        
        this.id++;
        
        let inputBuffer: Buffer;
        
        if ( typeof input === 'string' ) {
            inputBuffer = fs.readFileSync( input );
        } else {
            inputBuffer = input;
        }
        
        const inputFilePath  = path.join( os.tmpdir(), `sync-maestro-ffmpeg-input-${ this.id }` );
        const outputFilePath = path.join( os.tmpdir(), `sync-maestro-ffmpeg-output-${ this.id }` );
        
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
        
        switch ( device.bitrate ) {
            
            case 'Lossless':
                ffmpegArgs.push(
                    '-codec:a', 'flac',
                    '-compression_level', '0'
                );
                fileExtension = 'flac';
                break;
            
            case 'Compressed':
                ffmpegArgs.push(
                    '-codec:a', 'libopus',
                    '-b:a', '80k'
                );
                fileExtension = 'ogg';
                break;
        }
        
        /* Equalizer */
        
        if ( device.equalize ) {
            
            const ffmpegFilters = device.equalize.filters.reduce(
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
                    
                }, `volume=${ device.equalize.preamp }dB, `
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
}
