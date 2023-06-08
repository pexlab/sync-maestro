import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FeButtonModule, FeDropdownModule, FeModule, FeRootModule, FeTextFieldModule } from '@pexlab/ngx-front-engine';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DeviceSettingsDialogComponent } from '../device-settings-dialog/device-settings-dialog.component';
import { AppComponent } from './app.component';

@NgModule( {
    declarations: [
        AppComponent,
        DeviceSettingsDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FeModule.forRoot(),
        FeRootModule,
        AngularSvgIconModule.forRoot(),
        FeButtonModule,
        FeTextFieldModule,
        ReactiveFormsModule,
        FeDropdownModule
    ],
    providers   : [],
    bootstrap   : [
        AppComponent
    ]
} )
export class AppModule {}
