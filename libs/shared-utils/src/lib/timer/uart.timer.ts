import { Timer } from '@sync-maestro/shared-interfaces';
import { Subject } from 'rxjs';
import { SerialPort } from 'serialport';

export class UARTAdapter implements Timer {
    
    constructor(serial: string) {
        this.ttl = new SerialPort( {
            path    : serial,
            baudRate: 9600
        } );
    }
    
    public onTick      = new Subject<void>;
    public onMacroTick = new Subject<{ tick: number; ticks_since_startup: number }>;
    public onMicroTick = new Subject<{ tick: number; ticks_since_startup: number }>;
    
    private _enabled = false;
    
    private _macroTick              = 1;
    private _microTick              = 0;
    private _macroTicksSinceStartup = 0;
    private _microTicksSinceStartup = 0;
    
    private ttl;
    
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
        
        this.ttl.on( 'data', ( data ) => {
            
            let cycles = 0;
            
            const interval = setInterval( () => {
                
                this._microTick = this._microTick === 99 ? 0 : this._microTick + 1;
                this._microTicksSinceStartup++;
                
                this.onMicroTick.next( {
                    tick               : this._microTick,
                    ticks_since_startup: this._microTicksSinceStartup
                } );
                
                this.onTick.next();
                
                cycles++;
                
                if ( cycles === 100 ) {
                    clearInterval( interval );
                }
                
            }, 10 );
            
            this._macroTick = Number( data.toString() );
            this._macroTicksSinceStartup++;
            
            this.onMacroTick.next( {
                tick               : this._macroTick,
                ticks_since_startup: this._macroTicksSinceStartup
            } );
            
            this.onTick.next();
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
