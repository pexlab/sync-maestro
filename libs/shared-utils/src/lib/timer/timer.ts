import { ITimerSettings, TimerError, TimerWarning } from '@sync-maestro/shared-interfaces';
import { OverflowArray } from '../array.util';
import { Subject } from 'rxjs';

export abstract class Timer {
    
    public onTick      = new Subject<void>;
    public onMacroTick = new Subject<{ tick: number; ticks_since_startup: number; discrepancy_since_last_tick: number }>;
    public onMicroTick = new Subject<{ tick: number; ticks_since_startup: number; discrepancy_since_last_tick: number }>;
    public onError     = new Subject<TimerError>;
    public onWarning   = new Subject<TimerWarning>;
    
    private _enabled = false;
    
    private _currentMacroTick             = NaN;
    private _currentMicroTick             = NaN;
    private _currentMacroTickSinceStartup = 0;
    private _currentMicroTickSinceStartup = 0;
    
    //Contains the last two macros/micros that came in via data().
    private macroPuffer!: OverflowArray<TickPuffer>;
    private microPuffer!: OverflowArray<TickPuffer>;
    
    constructor( private settings: ITimerSettings ) {}
    
    public enable(): boolean {
        if ( this._enabled ) {
            return false;
        }
        
        this.reset();
        
        this._enabled = true;
        
        return true;
    }
    
    public disable(): boolean {
        console.log("disable")
        
        if ( !this._enabled ) {
            return false;
        }
        
        this._enabled = false;
        
        this.reset();
        return true;
    }
    
    private startByte: 0 | 255 | null = null;
    
    public data( data: number ) {
        if ( !this.enabled ) {
            return;
        }
        
        if ( data === 0 || data === 255 ) {
            this.startByte = data;
            return;
        }
        
        if ( this.startByte === null ) {
            return;
        }
        
        const now = performance.now();
        
        let macro = this._currentMacroTick;
        let micro = this._currentMicroTick;
        
        //Macro Tick
        if ( this.startByte === 0 ) {
            if ( !Number.isNaN( this._currentMacroTick ) ) {
                let expectedMacro = this.expectedMacro();
                
                const lastMacro = this.macroPuffer[ 0 ];
                
                if ( lastMacro.replaced ) {
                    
                    if ( this.expectedMacro( lastMacro.replacedTick ) === data ) {
                        console.log( 'Controller ist müll - Macro' );
                        expectedMacro = this.expectedMacro( lastMacro.replacedTick );
                    }
                    
                    const lastExpectedMacroReplaced = this.expectedMacro( lastMacro.tick );
                    
                    if ( lastExpectedMacroReplaced === data ) {
                        console.log( 'Vorheriger war fehlerhaft - Macro' );
                        this._currentMacroTickSinceStartup--;
                        
                        expectedMacro = lastExpectedMacroReplaced;
                    }
                }
                
                if ( expectedMacro != data ) {
                    switch ( this.settings.handleFaultyTick ) {
                        case 'Skip': {
                            this.startByte = null;
                            console.log( 'Skipping - Macro' );
                            return;
                        }
                        
                        case 'Replace': {
                            macro = expectedMacro;
                            
                            this.macroPuffer.unshift( {
                                replaced    : true,
                                tick        : macro,
                                replacedTick: data,
                                time        : now
                            } );
                            
                            console.log( 'Replacing - Macro' );
                            break;
                        }
                        
                        case 'None': {
                            //TODO: Error
                            macro = data;
                            
                            this.macroPuffer.unshift( {
                                replaced: false,
                                tick    : data,
                                time    : now
                            } );
                            break;
                        }
                    }
                } else {
                    macro = data;
                    
                    this.macroPuffer.unshift( {
                        replaced: false,
                        tick    : data,
                        time    : now
                    } );
                }
            } else {
                macro = data;
                
                this.macroPuffer.unshift( {
                    replaced: false,
                    tick    : macro,
                    time    : now
                } );
            }
            
            this._currentMacroTickSinceStartup++;
            
            data = 1;
            this.startByte = 0xFF;
            
            this._currentMacroTick = macro;
            
            const macroDiscrepancy = this.macroDiscrepancy;
            
            this.checkMacroThreshold( macroDiscrepancy );
            
            if ( !this._enabled ) {
                return;
            }
            
            this.onMacroTick.next( {
                tick                       : macro,
                ticks_since_startup        : this._currentMacroTickSinceStartup,
                discrepancy_since_last_tick: macroDiscrepancy
            } );
        }
        
        if ( Number.isNaN( this._currentMacroTick ) ) {
            return;
        }
        
        //Micro Tick
        if ( this.startByte === 255 ) {
            
            data -= 1;
            
            if ( !Number.isNaN( this._currentMicroTick ) ) {
                let expectedMicro = this.expectedMicro();
                const lastMicro = this.microPuffer[ 0 ];
                
                if ( lastMicro.replaced ) {
                    
                    if ( this.expectedMicro( lastMicro.replacedTick ) === data ) {
                        console.log( 'Controller ist müll - Micro' );
                        expectedMicro = this.expectedMacro( lastMicro.replacedTick );
                    }
                    
                    const lastExpectedMicroReplaced = this.expectedMicro( lastMicro.tick );
                    
                    if ( lastExpectedMicroReplaced === data ) {
                        console.log( 'Vorheriger war fehlerhaft - Micro' );
                        this._currentMicroTickSinceStartup--;
                        
                        expectedMicro = lastExpectedMicroReplaced;
                    }
                }
                
                if ( expectedMicro != data ) {
                    switch ( this.settings.handleFaultyTick ) {
                        case 'Skip': {
                            this.startByte = null;
                            console.log( 'Skipping - Micro' );
                            return;
                        }
                        
                        case 'Replace': {
                            micro = expectedMicro;
                            
                            this.microPuffer.unshift( {
                                replaced    : true,
                                tick        : micro,
                                replacedTick: data,
                                time        : now
                            } );
                            
                            console.log( 'Replacing - Micro' );
                            break;
                        }
                        
                        case 'None': {
                            //TODO: Error
                            micro = data;
                            
                            this.microPuffer.unshift( {
                                replaced: false,
                                tick    : data,
                                time    : now
                            } );
                            break;
                        }
                    }
                } else {
                    micro = data;
                    
                    this.microPuffer.unshift( {
                        replaced: false,
                        tick    : data,
                        time    : now
                    } );
                }
            } else {
                micro = data;
                
                this.microPuffer.unshift( {
                    replaced: false,
                    tick    : micro,
                    time    : now
                } );
            }
            
        }
        
        this._currentMicroTickSinceStartup++;
        
        this._currentMicroTick = micro;
        
        const microDiscrepancy = this.microDiscrepancy;
        
        this.checkMicroThreshold( microDiscrepancy );
        
        if ( !this._enabled ) {
            return;
        }
        
        this.onMicroTick.next( {
            tick                       : micro,
            ticks_since_startup        : this._currentMicroTickSinceStartup,
            discrepancy_since_last_tick: microDiscrepancy
        } );
        
        this.onTick.next();
    }
    
    public reset() {
        this._currentMacroTick             = NaN;
        this._currentMicroTick             = NaN;
        this._currentMacroTickSinceStartup = 0;
        this._currentMicroTickSinceStartup = 0;
        
        this.macroPuffer = new OverflowArray<TickPuffer>( 2 );
        this.microPuffer = new OverflowArray<TickPuffer>( 2 );
        
        this.startByte = null;
    }
    
    public checkMacroThreshold( discrepancy: number ) {
        if ( this.settings.macroDiscrepancy.undercutThreshold.warning != 0
            && discrepancy <= this.settings.macroDiscrepancy.undercutThreshold.warning ) {
            this.onWarning.next( TimerWarning.MacroDiscrapancyTooLow );
        }
        
        if ( this.settings.macroDiscrepancy.undercutThreshold.error != 0
            && discrepancy <= this.settings.macroDiscrepancy.undercutThreshold.error ) {
            this.onError.next( TimerError.MacroDiscrapancyTooLow );
        }
        
        if ( this.settings.macroDiscrepancy.undercutThreshold.disable != 0
            && discrepancy <= this.settings.macroDiscrepancy.undercutThreshold.disable ) {
            this.onError.next( TimerError.AutoDisablingTimer );
            this.disable();
        }
        
        if ( this.settings.macroDiscrepancy.undercutThreshold.warning != 0
            && discrepancy >= this.settings.macroDiscrepancy.exceedThreshold.warning ) {
            this.onWarning.next( TimerWarning.MacroDiscrapancyTooHigh );
        }
        
        if ( this.settings.macroDiscrepancy.undercutThreshold.error != 0
            && discrepancy >= this.settings.macroDiscrepancy.exceedThreshold.error ) {
            this.onError.next( TimerError.MacroDiscrapancyTooHigh );
        }
        
        if ( this.settings.macroDiscrepancy.undercutThreshold.disable != 0
            && discrepancy >= this.settings.macroDiscrepancy.exceedThreshold.disable ) {
            this.onError.next( TimerError.AutoDisablingTimer );
            this.disable();
        }
    }
    
    public checkMicroThreshold( discrepancy: number ) {
        if ( this.settings.microDiscrepancy.undercutThreshold.warning != 0
            && discrepancy <= this.settings.microDiscrepancy.undercutThreshold.warning ) {
            this.onWarning.next( TimerWarning.MicroDiscrapancyTooLow );
        }
        
        if ( this.settings.microDiscrepancy.undercutThreshold.error != 0
            && discrepancy <= this.settings.microDiscrepancy.undercutThreshold.error ) {
            this.onError.next( TimerError.MicroDiscrapancyTooLow );
        }
        
        if ( this.settings.microDiscrepancy.undercutThreshold.disable != 0
            && discrepancy <= this.settings.microDiscrepancy.undercutThreshold.disable ) {
            this.onError.next( TimerError.AutoDisablingTimer );
            this.disable();
        }
        
        if ( this.settings.microDiscrepancy.undercutThreshold.warning != 0
            && discrepancy >= this.settings.microDiscrepancy.exceedThreshold.warning ) {
            this.onWarning.next( TimerWarning.MicroDiscrapancyTooHigh );
        }
        
        if ( this.settings.microDiscrepancy.undercutThreshold.error != 0
            && discrepancy >= this.settings.microDiscrepancy.exceedThreshold.error ) {
            this.onError.next( TimerError.MicroDiscrapancyTooHigh );
        }
        
        if ( this.settings.microDiscrepancy.undercutThreshold.disable != 0
            && discrepancy >= this.settings.microDiscrepancy.exceedThreshold.disable ) {
            this.onError.next( TimerError.AutoDisablingTimer );
            this.disable();
        }
    }
    
    private expectedMacro( macro?: number ): number {
        if ( !macro ) {
            macro = this._currentMacroTick + 1;
        } else {
            macro++;
        }
        
        return macro <= 254 ? macro : macro % 254 + 1;
    }
    
    private expectedMicro( micro?: number ): number {
        if ( !micro ) {
            micro = this._currentMicroTick + 1;
        } else {
            micro++;
        }
        
        return micro <= 99 ? micro : micro % 99 - 1;
    }
    
    public get currentMacroTick(): number {
        return this._currentMacroTick;
    }
    
    public get currentMicroTick(): number {
        return this._currentMicroTick;
    }
    
    public get currentMacroTickSinceStartup(): number {
        return this._currentMacroTickSinceStartup;
    }
    
    public get currentMicroTickSinceStartup(): number {
        return this._currentMicroTickSinceStartup;
    }
    
    public get macroDiscrepancy(): number {
        if ( this.macroPuffer.length < 2 ) {
            return NaN;
        }
        
        const lastMacro        = this.macroPuffer[ 0 ];
        const penultimateMacro = this.macroPuffer[ 1 ];
        
        return ( 1000 - ( lastMacro.time - penultimateMacro.time ) ) * -1;
    }
    
    public get microDiscrepancy(): number {
        if ( this.microPuffer.length < 2 ) {
            return NaN;
        }
        
        const lastMicro        = this.microPuffer[ 0 ];
        const penultimateMicro = this.microPuffer[ 1 ];
        
        return ( 10 - ( lastMicro.time - penultimateMicro.time ) ) * -1;
    }
    
    public get enabled(): boolean {
        return this._enabled;
    }
}

type TickPuffer = {
    replaced: boolean;
    tick: number,
    replacedTick?: number,
    time: number
}