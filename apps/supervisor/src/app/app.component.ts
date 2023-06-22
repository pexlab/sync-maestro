import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, ElementRef, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Color, FeColorPalette, PopupService, ThemeService } from '@pexlab/ngx-front-engine';
import { IRegisteredDevice, ZClientToControlCommand, ZRegisteredDevice, ZServerToControllerCommand } from '@sync-maestro/shared-interfaces';
import { parseZod, ReadableCase, ReadableNumber } from '@sync-maestro/shared-utils';
import { SvgIconRegistryService } from 'angular-svg-icon';
import capitalize from 'just-capitalize';
import kebabCase from 'just-kebab-case';
import { retry, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { z } from 'zod';
import { DeviceSettingsDialogComponent } from '../device-settings-dialog/device-settings-dialog.component';

@Component( {
    selector   : 'sync-maestro-root',
    templateUrl: './app.component.html',
    styleUrls  : [ './app.component.scss' ]
} )
export class AppComponent implements AfterViewInit {
    
    @ViewChild( 'macro' ) private macro!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'macroSinceStartup' ) private macro_since_startup!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'macroOccurrence' ) private macro_occurrence!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'macroDiscrepancy' ) private macro_discrepancy!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'macroSinceStartupDiscrepancy' ) private macro_since_startup_discrepancy!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'micro' ) private micro!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'microSinceStartup' ) private micro_since_startup!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'microOccurrence' ) private micro_occurrence!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'microDiscrepancy' ) private micro_discrepancy!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'microSinceStartupDiscrepancy' ) private micro_since_startup_discrepancy!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'mediaName' ) private media_name!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'mediaStatus' ) private media_status!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'mediaPosition' ) private media_position!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'mediaProgress' ) private media_progress!: ElementRef<HTMLDivElement>;
    @ViewChild( 'mediaBar' ) private media_bar!: ElementRef<HTMLDivElement>;
    @ViewChild( 'mediaDuration' ) private media_duration!: ElementRef<HTMLSpanElement>;
    @ViewChild( 'mediaControl' ) private media_control!: ElementRef<HTMLDivElement>;
    
    private destroyRef = inject( DestroyRef );
    
    public activeDevices: z.infer<typeof ZRegisteredDevice>[] = [];
    
    constructor(
        private iconReg: SvgIconRegistryService,
        private theme: ThemeService,
        private http: HttpClient,
        private popup: PopupService
    ) {
        
        theme.applyCommonTheme(
            {
                typography: {
                    heading    : {
                        name: 'W95FA'
                    },
                    body       : {
                        name: 'W95FA'
                    },
                    subheading : {
                        name: 'W95FA'
                    },
                    decorative : {
                        name: 'W95FA'
                    },
                    caption    : {
                        name: 'W95FA'
                    },
                    display    : {
                        name: 'W95FA'
                    },
                    alternative: {
                        name: 'W95FA'
                    },
                    code       : {
                        name: 'W95FA'
                    }
                },
                palette   : {
                    background: {
                        primary   : FeColorPalette.Greyscale.PitchBlack,
                        secondary : FeColorPalette.Greyscale.Granite,
                        tertiary  : '#3d3d46',
                        quaternary: FeColorPalette.Greyscale.LightCharcoal
                    },
                    accent    : {
                        primary  : '#3b7751',
                        secondary: '#2f5e41'
                    },
                    text      : {
                        primary            : FeColorPalette.Greyscale.CoolGrey,
                        secondary          : FeColorPalette.Greyscale.CoolGrey,
                        tertiary           : '#3d3d46',
                        on_secondary_accent: FeColorPalette.Greyscale.CoolGrey
                    },
                    custom    : {
                        accent  : '#3b7751',
                        mute    : FeColorPalette.Greyscale.Smoke,
                        muteText: FeColorPalette.Greyscale.Asbestos
                    }
                }
            }
        );
        
        theme.applyComponentThemes( {
            popup    : {
                
                desktop: {
                    title : {
                        background: Color.fadeHex( this.theme.common.palette.background.tertiary, .25 ),
                        border    : Color.fadeHex( this.theme.common.palette.background.tertiary, .6 ),
                        exit      : Color.fadeHex( this.theme.common.palette.accent.primary, 1 )
                    },
                    border: Color.fadeHex( this.theme.common.palette.background.tertiary, .6 )
                },
                
                mobile: {
                    title: {
                        background: Color.fadeHex( this.theme.common.palette.background.tertiary, .25 ),
                        border    : Color.fadeHex( this.theme.common.palette.background.tertiary, .6 ),
                        exit      : Color.fadeHex( this.theme.common.palette.accent.primary, 1 )
                    }
                }
            },
            dropdown : {
                optionsIdleBackground : this.theme.common.palette.background.secondary,
                optionsHoverBackground: this.theme.common.palette.background.tertiary
            },
            textField: {
                disabled: {
                    background: this.theme.common.palette.background.primary
                }
            }
        } );
    }
    
    private websocket!: WebSocketSubject<unknown>;
    
    public ngAfterViewInit(): void {
        
        this.websocket = webSocket( {
            url: 'ws://localhost:3002'
        } );
        
        this.websocket.pipe(
            takeUntilDestroyed( this.destroyRef ),
            retry( {
                delay: () => {
                    
                    this.macro.nativeElement.innerText                           = '×';
                    this.macro_since_startup.nativeElement.innerText             = '×';
                    this.macro_occurrence.nativeElement.innerText                = '×';
                    this.macro_discrepancy.nativeElement.innerText               = '×';
                    this.macro_since_startup_discrepancy.nativeElement.innerText = '×';
                    
                    this.micro.nativeElement.innerText                           = '×';
                    this.micro_since_startup.nativeElement.innerText             = '×';
                    this.micro_occurrence.nativeElement.innerText                = '×';
                    this.micro_discrepancy.nativeElement.innerText               = '×';
                    this.micro_since_startup_discrepancy.nativeElement.innerText = '×';
                    
                    this.media_name.nativeElement.innerText        = '×';
                    this.media_status.nativeElement.innerText      = '×';
                    this.media_position.nativeElement.innerText    = '×';
                    this.media_duration.nativeElement.innerText    = '×';
                    this.media_progress.nativeElement.style.width  = '0%';
                    this.media_control.nativeElement.style.display = 'none';
                    
                    return timer( 2000 );
                }
            } )
        ).subscribe( {
            next: ( message ) => {
                
                try {
                    
                    const command = parseZod( ZServerToControllerCommand, message as any );
                    
                    switch ( command.type ) {
                        
                        case 'Info': {
                            
                            /* Macro */
                            
                            this.macro.nativeElement.innerText = ReadableNumber(
                                command.macro,
                                { padding: '000', sign: 'never', unit: 'Mt' }
                            );
                            
                            this.macro_since_startup.nativeElement.innerText = ReadableNumber(
                                command.macro_since_startup,
                                { padding: '000.000', sign: 'never', unit: 'Mt' }
                            );
                            
                            this.macro_occurrence.nativeElement.innerText = ReadableNumber(
                                command.macro_occurrence,
                                { sign: 'never', unit: 'ms' }
                            );
                            
                            this.macro_discrepancy.nativeElement.innerText = ReadableNumber(
                                command.macro_discrepancy,
                                { padding: '000.000', unit: 'μs' }
                            );
                            
                            this.macro_since_startup_discrepancy.nativeElement.innerText = ReadableNumber(
                                command.macro_since_startup_discrepancy,
                                { padding: '000.000', unit: 'μs' }
                            );
                            
                            /* Micro */
                            
                            this.micro.nativeElement.innerText = ReadableNumber(
                                command.micro,
                                { padding: '000', sign: 'never', unit: 'μt' }
                            );
                            
                            this.micro_since_startup.nativeElement.innerText = ReadableNumber(
                                command.micro_since_startup,
                                { padding: '000.000.000', sign: 'never', unit: 'μt' }
                            );
                            
                            this.micro_occurrence.nativeElement.innerText = ReadableNumber(
                                command.micro_occurrence,
                                { sign: 'never', unit: 'ms' }
                            );
                            
                            this.micro_discrepancy.nativeElement.innerText = ReadableNumber(
                                command.micro_discrepancy,
                                { padding: '000.000', unit: 'μs' }
                            );
                            
                            this.micro_since_startup_discrepancy.nativeElement.innerText = ReadableNumber(
                                command.micro_since_startup_discrepancy,
                                { padding: '000.000', unit: 'μs' }
                            );
                            
                            /* Devices */
                            
                            this.activeDevices = command.devices;
                            
                            /* Media */
                            
                            this.media_name.nativeElement.innerText = 'Video: ' + command.current_media.name;
                            
                            let positionSeconds   = Math.floor( command.current_media.position / 1000 );
                            const positionMinutes = Math.floor( positionSeconds / 60 );
                            positionSeconds       = Math.floor( positionSeconds % 60 );
                            
                            let durationSeconds   = Math.floor( command.current_media.duration / 1000 );
                            const durationMinutes = Math.floor( durationSeconds / 60 );
                            durationSeconds       = Math.floor( durationSeconds % 60 );
                            
                            this.media_position.nativeElement.innerText = `${ positionMinutes.toString().padStart( 2, '0' ) }:${ positionSeconds.toString().padStart( 2, '0' ) }`;
                            
                            this.media_duration.nativeElement.innerText = `${ durationMinutes.toString().padStart( 2, '0' ) }:${ durationSeconds.toString().padStart( 2, '0' ) }`;
                            
                            const progressPercent = command.current_media.position / command.current_media.duration * 100;
                            
                            this.media_progress.nativeElement.style.width = `${ progressPercent.toFixed( 2 ) }%`;
                            
                            this.media_control.nativeElement.innerText = command.current_media.paused ? '▶' : '⏸';
                            
                            if ( command.current_media.waiting ) {
                                this.media_status.nativeElement.innerText = 'Status: Waiting for takeoff';
                            } else {
                                this.media_status.nativeElement.innerText = 'Status: ' + ( command.current_media.paused ? 'Paused' : 'Playing' );
                            }
                            
                            this.media_control.nativeElement.style.display = 'block';
                            
                            break;
                        }
                    }
                    
                } catch ( ignored ) {
                }
            }
        } );
    }
    
    public configureDevice( device: z.infer<typeof ZRegisteredDevice> ) {
        
        const popup = this.popup.createPopupRef( {
            title    : 'Configure device',
            component: DeviceSettingsDialogComponent,
            reflect  : { device },
            size     : {
                minWidth : '90vw',
                minHeight: '90vh'
            }
        } );
        
        popup.onTransmit( ( message ) => {
            if ( typeof message === 'object' ) {
                this.websocket.next( parseZod( ZClientToControlCommand, {
                    type  : 'ConfigureDevice',
                    name  : device.name,
                    config: message
                } ) );
            }
        } );
        
        popup.open();
    }
    
    public trackByDevice( index: number, device: IRegisteredDevice ) {
        return device.name;
    }
    
    public toggle() {
        this.websocket.next( parseZod( ZClientToControlCommand, {
            type: 'TogglePlayback'
        } ) );
    }
    
    public skip() {
        this.websocket.next( parseZod( ZClientToControlCommand, {
            type: 'Next'
        } ) );
    }
    
    public rewind() {
        this.websocket.next( parseZod( ZClientToControlCommand, {
            type: 'Previous'
        } ) );
    }
    
    public scrub( event: MouseEvent ) {
        
        const mouseX     = event.clientX;
        const mediaStart = this.media_bar.nativeElement.getBoundingClientRect().left;
        const mediaEnd   = this.media_bar.nativeElement.getBoundingClientRect().right;
        const percent    = ( mouseX - mediaStart ) / ( mediaEnd - mediaStart );
        
        this.websocket.next( parseZod( ZClientToControlCommand, {
            type         : 'Scrub',
            be_at_percent: percent
        } ) );
    }
    
    protected readonly kebabCase      = kebabCase;
    protected readonly capitalize     = capitalize;
    protected readonly ReadableCase   = ReadableCase;
    protected readonly ReadableNumber = ReadableNumber;
}
