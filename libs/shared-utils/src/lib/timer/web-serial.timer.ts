import { ITimerSettings } from '@sync-maestro/shared-interfaces';
import { Timer } from './timer';

export class WebSerialTimer extends Timer {
    
    constructor( private port: any, settings: ITimerSettings ) {
        super( settings );
    }
    
    public override enable(): boolean {
        const enabled = super.enable();
        
        if ( !enabled ) {
            return false;
        }
        
        if(this.port === null){
            return false;
        }
        
        if ( !this.port.isOpen ) {
            this.port.open( {
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity  : 'none'
            } ).then( this.readLoop() );
        }
        
        return true;
    }
    
    public override disable(): boolean {
        
        const disabled = super.disable();
        
        if ( !disabled ) {
            return false;
        }
        
        this.port.close();
        
        return false;
    }
    
    private readLoop = async () => {
        const reader = this.port.readable.getReader();
        
        let buffer = new Uint8Array();
        
        while ( this.enabled ) {
            const { value, done } = await reader.read();
            
            if ( done ) {
                reader.releaseLock();
                this.disable();
                break;
            }
            
            const dataToBeProcessed = new Uint8Array( buffer.length + value.length );
            
            dataToBeProcessed.set( buffer, 0 );
            dataToBeProcessed.set( value, buffer.length );
            
            buffer = dataToBeProcessed;
            
            while ( buffer.length > 0 ) {
                this.data( buffer[ 0 ] );
                buffer.slice( 1 );
            }
        }
    };
    
    public setPort(port:any){
        if(this.enabled){
            //TODO: Throw Error
            return;
        }
        
        this.port = port;
    }
}
