import { Controller, Get, OnModuleInit, Param, Post } from '@nestjs/common';
import { IStatus } from '@sync-maestro/shared-interfaces';
import { Instructor } from './instructor';

@Controller( 'instructor' )
export class InstructorController implements OnModuleInit {
    
    private instructor!: Instructor;
    
    constructor() {
    }
    
    public onModuleInit(): any {
        this.instructor = new Instructor();
    }
    
    @Get( 'pause' )
    public pause() {
        if ( !this.instructor ) {
            return;
        }
        
        this.instructor.pause();
    }
    
    @Get( 'resume' )
    public resume() {
        if ( !this.instructor ) {
            return;
        }
        
        this.instructor.resume();
    }
    
    @Get( 'next' )
    public next() {
        if ( !this.instructor ) {
            return;
        }
        
        this.instructor.next();
    }
    
    @Get( 'prev' )
    public prev() {
        if ( !this.instructor ) {
            return;
        }
        
        this.instructor.prev();
    }
    
    @Get( 'scrub/:time' )
    public scrub( @Param( 'time' ) time: number ) {
        if ( !this.instructor ) {
            return;
        }
        
        this.instructor.scrub( time );
    }
    
    @Get( 'status' )
    public getStatus(): IStatus | undefined {
        if ( !this.instructor ) {
            return;
        }
        
        return {
            playlist     : this.instructor.current_playlist,
            state        : this.instructor.state,
            media_index  : this.instructor.current_media_index,
            media_runtime: this.instructor.media_runtime
        };
    }
    
}
