import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Color, FeColorPalette, PopupService, ThemeService } from '@pexlab/ngx-front-engine';
import { ZRegisteredDevice } from '@sync-maestro/shared-interfaces';
import { PromiseLoop, ReadableCase, ReadableNumber, SimulateAdapter } from '@sync-maestro/shared-utils';
import { SvgIconRegistryService } from 'angular-svg-icon';
import capitalize from 'just-capitalize';
import kebabCase from 'just-kebab-case';
import { z } from 'zod';
import { DeviceSettingsDialogComponent } from '../device-settings-dialog/device-settings-dialog.component';

@Component( {
    selector   : 'sync-maestro-root',
    templateUrl: './app.component.html',
    styleUrls  : [ './app.component.scss' ]
} )
export class AppComponent implements AfterViewInit {
    
    @ViewChild( 'macroTick' )
    private macroTickMsg!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'microTick' )
    private microTickMsg!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'macroTicksSinceStart' )
    private macroSinceStartMsg!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'microTicksSinceStart' )
    private microSinceStartMsg!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'macroTickLastUpdate' )
    private lastUpdateMsgMacro!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'microTickLastUpdate' )
    private lastUpdateMsgMicro!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'macroTickDiscrepancy' )
    private discrepancyMsgMacro!: ElementRef<HTMLSpanElement>;
    
    @ViewChild( 'microTickDiscrepancy' )
    private discrepancyMsgMicro!: ElementRef<HTMLSpanElement>;
    
    private lastMacroUpdate: number = 0;
    private lastMicroUpdate: number = 0;
    
    private lastMacroDiscrepancyChange = 0;
    private lastMicroDiscrepancyChange = 0;
    
    public activeDevices: z.infer<typeof ZRegisteredDevice>[] = [];
    
    public timer = new SimulateAdapter();
    
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
    
    public ngAfterViewInit(): void {
        
        this.timer.enable();
        
        this.updateLoop();
        
        this.timer.macroTick.subscribe( ( tick ) => {
            this.lastMacroUpdate = performance.now();
        } );
        
        this.timer.microTick.subscribe( ( tick ) => {
            this.lastMicroUpdate = performance.now();
        } );
        
        const stopLoop = PromiseLoop( () => {
            
            return new Promise<void>( ( resolve ) => {
                this.http.get<z.infer<typeof ZRegisteredDevice>[]>( 'http://localhost:3000/devices' ).subscribe( {
                    next    : ( response ) => {
                        this.activeDevices = response;
                    },
                    complete: () => {
                        resolve();
                    }
                } );
            } );
            
        }, 500 );
    }
    
    public configureDevice( device: z.infer<typeof ZRegisteredDevice> ) {
        this.popup.createPopupRef( {
            title    : 'Configure device',
            component: DeviceSettingsDialogComponent,
            reflect  : { device },
            size     : {
                minWidth : '90vw',
                minHeight: '90vh'
            }
        } ).open();
    }
    
    public trackByDevice( index: number, device: z.infer<typeof ZRegisteredDevice> ) {
        return device.identifier;
    }
    
    private updateLoop() {
        
        if ( !this.lastUpdateMsgMicro ) {
            return;
        }
        
        const macro = this.lastMacroUpdate;
        const micro = this.lastMicroUpdate;
        const now   = performance.now();
        
        const microSinceLastMacroTick = Math.floor( ( now - macro ) * 1000 );
        const milliSinceLastMacroTick = Math.floor( now - macro );
        
        const microSinceLastMicroTick = Math.floor( ( now - micro ) * 1000 );
        
        this.lastUpdateMsgMacro.nativeElement.innerText = ReadableNumber( milliSinceLastMacroTick, { padding: '000.000', unit: 'ms' } );
        this.lastUpdateMsgMicro.nativeElement.innerText = ReadableNumber( microSinceLastMicroTick, { padding: '000.000', unit: 'μs' } );
        
        const discrepancyMacro = microSinceLastMacroTick > 1000000 ? microSinceLastMacroTick - 1000000 : 0;
        const discrepancyMicro = microSinceLastMicroTick > 10000 ? microSinceLastMicroTick - 10000 : 0;
        
        if ( discrepancyMacro !== 0 || now - this.lastMacroDiscrepancyChange > 2000 ) {
            this.discrepancyMsgMacro.nativeElement.innerText = ReadableNumber( discrepancyMacro, { padding: '000.000', unit: 'μs' } );
            this.lastMacroDiscrepancyChange                  = now;
        }
        
        if ( discrepancyMicro !== 0 || now - this.lastMicroDiscrepancyChange > 1000 ) {
            this.discrepancyMsgMicro.nativeElement.textContent = ReadableNumber( discrepancyMicro, { padding: '000.000', unit: 'μs' } );
            this.lastMicroDiscrepancyChange                    = now;
        }
        
        this.macroTickMsg.nativeElement.innerText       = ReadableNumber( this.timer.currentMacroTick, { padding: '000', sign: 'never', unit: ' t' } );
        this.macroSinceStartMsg.nativeElement.innerText = ReadableNumber( this.timer.currentMacroTickSinceStartup, { padding: '000.000', sign: 'never', unit: ' t' } );
        
        this.microTickMsg.nativeElement.innerText       = ReadableNumber( this.timer.currentMicroTick, { padding: '000', sign: 'never', unit: ' t' } );
        this.microSinceStartMsg.nativeElement.innerText = ReadableNumber( this.timer.currentMicroTickSinceStartup, { padding: '0.000.000', sign: 'never', unit: ' t' } );
        
        requestAnimationFrame( () => {
            this.updateLoop();
        } );
    }
    
    protected readonly kebabCase      = kebabCase;
    protected readonly capitalize     = capitalize;
    protected readonly ReadableCase   = ReadableCase;
    protected readonly ReadableNumber = ReadableNumber;
}
