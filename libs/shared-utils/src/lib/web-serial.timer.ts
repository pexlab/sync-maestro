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
        
        ( navigator as any ).serial.requestPort().then( ( port: any ) => {
            
            port.open( {
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity  : 'none'
            } ).then( () => {
                
                let reader;
                
                let buffer = new Uint8Array();
                
                let startByte: 0 | 255 | null = null;
                
                const readLoop = async () => {
                    
                    reader = port.readable.getReader();
                    
                    while ( true ) {
                        
                        const { value, done } = await reader.read();
                        
                        if ( done ) {
                            reader.releaseLock();
                            break;
                        }
                        
                        const dataToBeProcessed = new Uint8Array( buffer.length + value.length );
                        
                        dataToBeProcessed.set( buffer, 0 );
                        dataToBeProcessed.set( value, buffer.length );
                        
                        buffer = dataToBeProcessed;
                        
                        while ( buffer.length > 0 ) {
                            
                            if ( startByte === null ) {
                                
                                if ( buffer[ 0 ] === 255 || buffer[ 0 ] === 0 ) {
                                    startByte = buffer[ 0 ];
                                }
                                
                                buffer = buffer.slice( 1 );
                                
                            } else {
                                
                                if ( buffer.length < 1 ) {
                                    break;
                                }
                                
                                const payload = buffer.slice( 0, 1 );
                                
                                buffer = buffer.slice( 1 );
                                
                                const tick = payload[ 0 ];
                                
                                /* Macro Tick */
                                if ( startByte === 0 ) {
                                    
                                    this._macroTick = tick;
                                    this._macroTicksSinceStartup++;
                                    
                                    this._microTick = 0x00;
                                    
                                    this.onMacroTick.next( {
                                        tick               : this._macroTick,
                                        ticks_since_startup: this._macroTicksSinceStartup
                                    } );
                                }
                                
                                /* Micro Tick */
                                if ( startByte === 255 ) {
                                    this._microTick = tick - 1;
                                }
                                
                                this._microTicksSinceStartup++;
                                
                                this.onMicroTick.next( {
                                    tick               : this._microTick,
                                    ticks_since_startup: this._microTicksSinceStartup
                                } );
                                
                                this.onTick.next();
                                
                                startByte = null;
                            }
                        }
                    }
                };
                
                readLoop();
            } );
        } );
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
