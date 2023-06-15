import { Timer } from '@sync-maestro/shared-interfaces';
import { Subject } from 'rxjs';

export class WebSerialTimer implements Timer {
    
    public onTick      = new Subject<void>;
    public onMacroTick = new Subject<{ tick: number; ticks_since_startup: number }>;
    public onMicroTick = new Subject<{ tick: number; ticks_since_startup: number }>;
    
    private _enabled = false;
    
    private _macroTick              = 1;
    private _microTick              = 0;
    private _macroTicksSinceStartup = 0;
    private _microTicksSinceStartup = 0;
    
    private _lastSerialData!: number;
    
    public get currentMacroTick(): number {
        return this._macroTick;
    }
    
    public get currentMicroTick(): number {
        return this._microTick;
    }
    
    public get currentMacroTickSinceStartup(): number {
        return this._macroTicksSinceStartup;
    }
    
    public get currentMicroTickSinceStartup(): number {
        return this._microTicksSinceStartup;
    }
    
    public get enabled(): boolean {
        return this._enabled;
    }
    
    public enable(): void {
        
        if ( this._enabled ) {
            return;
        }
        
        (navigator as any).serial.requestPort().then((port: any) => {
            
            port.open({ baudRate: 9600 }).then(() => {
                
                const reader = port.readable.getReader();
                
                const read = () => {
                    
                    reader.read().then((data: any) => {
                        
                        if (data.done) {
                            return;
                        }
                        
                        const dataAsNumber = Number( data.value.toString() );
                        
                        if ( this._lastSerialData
                            && dataAsNumber != 0x00
                            && dataAsNumber != 0xFF ) {
                            
                            //Macro Tick
                            if ( this._lastSerialData === 0x00 ) {
                                this._macroTick = dataAsNumber;
                                this._macroTicksSinceStartup++;
                                
                                this._microTick = 0x00;
                                
                                this.onMacroTick.next( {
                                    tick               : this._macroTick,
                                    ticks_since_startup: this._macroTicksSinceStartup
                                } );
                            }
                            
                            //Micro Tick
                            if(this._lastSerialData === 0xFF){
                                this._microTick = dataAsNumber - 1;
                            }
                            
                            this._microTicksSinceStartup++;
                            
                            this.onMicroTick.next( {
                                tick               : this._microTick,
                                ticks_since_startup: this._microTicksSinceStartup
                            } );
                            
                            this.onTick.next();
                        }
                        
                        this._lastSerialData = dataAsNumber;
                        
                        read();
                        
                    });
                    
                };
                
                read();
                
            });
            
        });
        
        // this.ttl.on( 'data', ( data ) => {
        //
        //     let cycles = 0;
        //
        //     const interval = setInterval( () => {
        //
        //         this._microTick = this._microTick === 99 ? 0 : this._microTick + 1;
        //         this._microTicksSinceStartup++;
        //
        //         this.onMicroTick.next( {
        //             tick               : this._microTick,
        //             ticks_since_startup: this._microTicksSinceStartup
        //         } );
        //
        //         this.onTick.next();
        //
        //         cycles++;
        //
        //         if ( cycles === 100 ) {
        //             clearInterval( interval );
        //         }
        //
        //     }, 10 );
        //
        //     this._macroTick = Number( data.toString() );
        //     this._macroTicksSinceStartup++;
        //
        //     this.onMacroTick.next( {
        //         tick               : this._macroTick,
        //         ticks_since_startup: this._macroTicksSinceStartup
        //     } );
        //
        //     this.onTick.next();
        // } );
    }
    
    public disable(): void {
        
        if ( !this._enabled ) {
            return;
        }
        
        this._macroTick              = 1;
        this._microTick              = 0;
        this._macroTicksSinceStartup = 0;
        this._microTicksSinceStartup = 0;
    }
}
