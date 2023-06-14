import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InstructorController } from './instructor.controller';

@Module( {
    imports    : [],
    controllers: [ AppController, InstructorController ],
    providers  : [ ]
} )
export class AppModule {
}
