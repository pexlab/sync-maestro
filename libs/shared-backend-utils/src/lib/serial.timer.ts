import { ITimerSettings } from '@sync-maestro/shared-interfaces';
import { Timer } from '@sync-maestro/shared-utils';
import { SerialPort } from 'serialport';

export class SerialTimer extends Timer {
    
    private ttl: SerialPort;
    
    constructor( serial: string, settings: ITimerSettings ) {
        super(settings);
        
        this.ttl = new SerialPort( {
            autoOpen: false,
            path    : serial,
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: "none",
            highWaterMark: 1,
            xon: false,
            xoff: false,
            xany: true,
            rtscts: false,
            hupcl: false,
            vmin: 0,
            vtime: 0
        } );
    }
    
    public override enable(): boolean {
        
        const enabled = super.enable();
        
        if ( !enabled ) {
            return false;
        }
        
        if(this.ttl.isOpen){
            this.ttl.resume();
        }else{
            this.ttl.open();
        }
        
        this.ttl.on( 'data', ( data ) => {
            
            this.data(data[0])
        } );
        
        return true;
    }
    
    public override disable(): boolean{
        const disabled = super.disable();
        
        if ( !disabled ) {
            return false;
        }
        
        this.ttl.pause();
        
        return true;
    }
}
