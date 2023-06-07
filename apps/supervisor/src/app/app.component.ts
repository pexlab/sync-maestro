import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { capitalizedKebabCase, ThemeService } from '@pexlab/ngx-front-engine';
import { ZDeviceConfig } from '@sync-maestro/shared-interfaces';
import { ReadableCase, ReadableNumber } from '@sync-maestro/shared-utils';
import { SvgIconRegistryService } from 'angular-svg-icon';
import capitalize from 'just-capitalize';
import kebabCase from 'just-kebab-case';
import replaceAll from 'just-replace-all';
import { z } from 'zod';

@Component( {
    selector   : 'sync-maestro-root',
    templateUrl: './app.component.html',
    styleUrls  : [ './app.component.scss' ]
} )
export class AppComponent implements AfterViewInit {
    
    @ViewChild( 'shortCycle' )
    private shortCycleMsg!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'longCycle' )
    private longCycleMsg!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'shortCycleLastUpdate' )
    private lastUpdateMsgShort!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'longCycleLastUpdate' )
    private lastUpdateMsgLong!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'shortCycleDiscrepancy' )
    private discrepancyMsgShort!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'longCycleDiscrepancy' )
    private discrepancyMsgLong!: ElementRef<HTMLSpanElement>;
    
    private shortCycle = 0;
    private longCycle  = 0;
    
    private lastShortUpdate: number = 0;
    private lastLongUpdate: number  = 0;
    
    private lastShortDiscrepancyChange = 0;
    private lastLongDiscrepancyChange  = 0;
    
    public activeDevices: z.infer<typeof ZDeviceConfig>[] = [
        {
            type    : 'Audio',
            device  : 'WiredSpeaker',
            name    : 'Hauptanlage Audio-Rack',
            channels: [ 'Serie' ],
            offset: 0,
            audio   : {
                codec      : 'Flac',
                compression: 'Raw',
                container  : 'Flac'
            }
        },
        {
            type    : 'Video',
            device  : 'MobilePhone',
            name    : 'Uwe\'s Gurke',
            channels: [ 'Serie' ],
            offset: -342,
            video   : {
                fit        : 'StretchImage',
                resolution : '480p',
                codec      : 'H.264 / AVC',
                compression: 'StrongCompression',
                container  : 'Mp4'
            }
        },
        {
            type    : 'Audio',
            device  : 'CarAudio',
            name    : 'Jana\'s Ford Fokus',
            channels: [ 'Sanitäre Beschallung' ],
            offset: -25,
            audio   : {
                codec      : 'Opus',
                compression: '80KbpsBitrate',
                container  : 'Ogg'
            }
        }
    ];
    
    constructor( private iconReg: SvgIconRegistryService, private theme: ThemeService) {
        
        theme.applyCommonTheme({
            palette: {
                accent: {
                    primary: '#3b7751',
                    secondary: '#2f5e41',
                }
            },
            typography: {
                heading: {
                    name: 'W95FA'
                },
                code: {
                    name: 'W95FA'
                }
            }
        });
        
        theme.applyComponentThemes();
    }
    
    public ngAfterViewInit(): void {
        
        this.updateLoop();
        
        setInterval( () => {
            
            this.lastLongUpdate = performance.now();
            
            this.longCycle = this.longCycle >= 255 ? 0 : this.longCycle + 1;
            
        }, 1000 );
        
        setInterval( () => {
            
            this.lastShortUpdate = performance.now();
            
            this.shortCycle = this.shortCycle >= 255 ? 0 : this.shortCycle + 1;
            
        }, 10 );
    }
    
    private updateLoop() {
        
        if ( !this.lastUpdateMsgShort ) {
            return;
        }
        
        const short = this.lastShortUpdate;
        const long  = this.lastLongUpdate;
        const now   = performance.now();
        
        const microSinceLastShort = Math.floor( ( now - short ) * 1000 );
        
        const microSinceLastLong = Math.floor( ( now - long ) * 1000 );
        const milliSinceLastLong = Math.floor( now - long );
        
        this.lastUpdateMsgShort.nativeElement.innerText = ReadableNumber( microSinceLastShort, { padding: '000.000', unit: 'μs' } );
        this.lastUpdateMsgLong.nativeElement.innerText  = ReadableNumber( milliSinceLastLong, { padding: '000.000', unit: 'ms' } );
        
        const discrepancyShort = microSinceLastShort > 10000 ? microSinceLastShort - 10000 : 0;
        const discrepancyLong  = microSinceLastLong > 1000000 ? microSinceLastLong - 1000000 : 0;
        
        if ( discrepancyShort !== 0 || now - this.lastShortDiscrepancyChange > 1000 ) {
            this.discrepancyMsgShort.nativeElement.textContent = ReadableNumber( discrepancyShort, { padding: '000.000', unit: 'μs' } );
            this.lastShortDiscrepancyChange                    = now;
        }
        
        if ( discrepancyLong !== 0 || now - this.lastLongDiscrepancyChange > 2000 ) {
            this.discrepancyMsgLong.nativeElement.innerText = ReadableNumber( discrepancyLong, { padding: '000.000', unit: 'μs' } );
            this.lastLongDiscrepancyChange                  = now;
        }
        
        this.shortCycleMsg.nativeElement.innerText = ReadableNumber( this.shortCycle, { padding: '000', sign: 'never', unit: ' t' } );
        this.longCycleMsg.nativeElement.innerText  = ReadableNumber( this.longCycle, { padding: '000', sign: 'never', unit: ' t' } );
        
        requestAnimationFrame( () => {
            this.updateLoop();
        } );
    }
    
    protected readonly kebabCase            = kebabCase;
    protected readonly replaceAll           = replaceAll;
    protected readonly capitalize           = capitalize;
    protected readonly capitalizedKebabCase = capitalizedKebabCase;
    protected readonly ReadableCase   = ReadableCase;
    protected readonly ReadableNumber = ReadableNumber;
}
