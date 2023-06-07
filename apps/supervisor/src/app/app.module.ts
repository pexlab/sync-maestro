import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FeButtonModule, FeModule, FeRootModule } from '@pexlab/ngx-front-engine';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AppComponent } from './app.component';

@NgModule( {
    declarations: [ AppComponent ],
    imports     : [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FeModule.forRoot(),
        FeRootModule,
        AngularSvgIconModule.forRoot(),
        FeButtonModule
    ],
    providers   : [],
    bootstrap   : [ AppComponent ]
} )
export class AppModule {}
