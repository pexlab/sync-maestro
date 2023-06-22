import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { IFePopup } from '@pexlab/ngx-front-engine';
import { IRegisteredDevice, ZDeviceConfig } from '@sync-maestro/shared-interfaces';

@Component( {
    templateUrl: './device-settings-dialog.component.html',
    styleUrls  : [ './device-settings-dialog.component.scss' ]
} )
export class DeviceSettingsDialogComponent implements IFePopup, OnInit, AfterViewInit {
    
    public device!: IRegisteredDevice;
    
    public group: ReturnType<typeof this.getFormGroup> = undefined;
    
    constructor( private fb: FormBuilder, private http: HttpClient ) {
    }
    
    public close!: () => void;
    public transmitToHost!: ( value: any ) => void;
    
    public ngOnInit(): void {
        this.group = this.getFormGroup();
    }
    
    public ngAfterViewInit(): void {
        
        if ( this.group ) {
            
            const channelArray = this.group.get( 'channel' ) as FormArray;
            
            channelArray.valueChanges.subscribe( ( channels: any[] ) => {
                
                // If the last control is non-empty, add a new control
                if ( channels[ channels.length - 1 ] !== null ) {
                    channelArray.push( this.fb.control( null ) );
                }
                
                // If the last two controls are empty, remove the last one
                if ( channels.length > 1 && channels[ channels.length - 1 ] === null && channels[ channels.length - 2 ] === null ) {
                    channelArray.removeAt( channels.length - 1 );
                }
            } );
        }
    }
    
    private getFormGroup() {
        return this.device ? this.fb.group( {
            name       : { value: this.device.name, disabled: true },
            displayName: this.device.displayName,
            channel    : this.fb.array( [ ...this.device.channels.map( ( channel ) => this.fb.control( channel ) ), this.fb.control( null ) ] ),
            offset     : this.device.offset,
            type       : this.device.type,
            device     : this.device.device,
            video      : this.fb.group( {
                resolution : this.device.type === 'Video' ? this.device.video.resolution : null,
                fit        : this.device.type === 'Video' ? this.device.video.fit : null,
                codec      : this.device.type === 'Video' ? this.device.video.codec : null,
                compression: this.device.type === 'Video' ? this.device.video.compression : null,
                container  : this.device.type === 'Video' ? this.device.video.container : null
            } ),
            audio      : this.fb.group( {
                codec      : this.device.type === 'Audio' ? this.device.audio.codec : null,
                compression: this.device.type === 'Audio' ? this.device.audio.compression : null,
                container  : this.device.type === 'Audio' ? this.device.audio.container : null
            } )
        } ) : undefined;
    }
    
    public convert() {
        
        if ( !this.group ) {
            return;
        }
        
        const val = {
            ...this.group.value,
            channels: this.group.value.channel?.filter( ( channel: any ) => channel !== null ) ?? [],
            offset  : +( this.group.value.offset ?? 0 )
        };
        
        if ( val.type === 'Video' ) {
            delete val.audio;
        }
        
        if ( val.type === 'Audio' ) {
            delete val.video;
        }
        
        this.transmitToHost( val);
        this.close();
    }
    
    public oneOf( value: string | null, ...values: ( string | null )[] ) {
        
        if ( value === null ) {
            return false;
        }
        
        return values.includes( value );
    }
}
