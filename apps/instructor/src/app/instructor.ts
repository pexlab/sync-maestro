import { IPlaylist, IState, Timer, ZPlaylist } from '@sync-maestro/shared-interfaces';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { timer } from '../main';
import { clientManagerService } from './services/client-manager.service';

export class Instructor {
    
    private _playlists: IPlaylist[] = [];
    
    private _current_playlist!: IPlaylist;
    
    private _current_media_index = 0;
    private _current_media_begin = 0;
    
    private _wait_for_take_off = false;
    private _paused            = true;
    
    constructor() {
        
        this.loadPlaylistsFromFile( path.join( process.cwd(), 'apps', 'instructor', 'src', 'assets', 'playlist.json' ) );
        this.setCurrentPlaylist( 0 );
        
        timer.enable();
        
        timer.onMicroTick.subscribe( value => {
            const micro_since_startup = value.ticks_since_startup;
            
            if ( this._paused || this._wait_for_take_off ) {
                this._current_media_begin++;
                return;
            }
            
            const current_media = this.current_playlist.media[ this._current_media_index ];
            
            const media_runtime   = micro_since_startup - this._current_media_begin;
            const media_remaining = current_media.duration_micro - media_runtime;
            
            if ( media_remaining <= 0 ) {
                this.next();
            }
        } );
    }
    
    private takeOff() {
        if ( this._paused ) {
            return;
        }
        
        if(!this._wait_for_take_off){
            return;
        }
        
        const macro = timer.currentMacroTick;
        const micro = timer.currentMicroTick;
        
        const resume_macro = this.normalizeMacro( macro + 2 );
        const resume_micro = 0;
        
        const resume_offset = macro - micro;
        
        this._current_media_begin -= resume_offset;
        this._wait_for_take_off = false;
        
        for ( const [ name, client ] of clientManagerService.clientNameWithControllers ) {
            client.resume(resume_macro, resume_micro)
        }
    }
    
    private prepareForTakeOff() {
        const micro_since_startup = timer.currentMicroTickSinceStartup;
        
        const current_media = this.current_playlist.media[ this._current_media_index ];
        
        const media_runtime = micro_since_startup - this._current_media_begin;
        const be_at         = media_runtime * 10;
        
        this._wait_for_take_off = true;
        
        for ( const [ name, client ] of clientManagerService.clientNameWithControllers ) {
            client.pause(be_at, current_media.file_path)
        }
    }
    
    public resume() {
        if ( !this._paused ) {
            return;
        }
        
        this._paused = false;
        
        this.prepareForTakeOff();
    }
    
    public pause() {
        this._paused = true;
        
        const micro_since_startup = timer.currentMicroTickSinceStartup;
        
        const current_media = this.current_playlist.media[ this._current_media_index ];
        
        const media_runtime = micro_since_startup - this._current_media_begin;
        const be_at         = media_runtime * 10;
        
        for ( const [ mac, client ] of clientManagerService.clientNameWithControllers ) {
            client.pause(be_at, current_media.file_path)
        }
    }
    
    public next() {
        this._current_media_begin = timer.currentMicroTickSinceStartup;
        
        this.setCurrentMediaIndex( this.current_media_index + 1 );
        
        if ( this._paused ) {
            return;
        }
        
        this.prepareForTakeOff();
    }
    
    public prev() {
        this._current_media_begin = timer.currentMicroTickSinceStartup;
        
        this.setCurrentMediaIndex( this.current_media_index - 1 );
        
        if ( this._paused ) {
            return;
        }
        
        this.prepareForTakeOff();
    }
    
    public scrub( time: number ) {
        const micro_since_startup = timer.currentMicroTickSinceStartup;
        
        const current_media = this.current_playlist.media[ this._current_media_index ];
        
        if ( time > current_media.duration ) {
            return;
        }
        
        const time_in_micro = time / 10;
        
        this._current_media_begin = micro_since_startup - time_in_micro;
        
        if ( this._paused ) {
            return;
        }
        
        this.prepareForTakeOff();
    }
    
    private loadPlaylistsFromFile( path: string ) {
        const data = fs.readFileSync( path, 'utf-8' );
        
        const json = JSON.parse( data );
        
        this._playlists = ZPlaylist.array().parse( json.playlists );
    }
    
    private setCurrentPlaylist( id: number ) {
        for ( const playlist of this._playlists ) {
            if ( playlist.id === id ) {
                this._current_playlist = playlist;
                return;
            }
        }
    }
    
    private normalizeMediaIndex( playlist: IPlaylist, media_index: number ) {
        const media_length       = playlist.media.length;
        const media_index_length = media_length - 1;
        
        if ( media_index > media_index_length ) {
            return ( media_index % media_length );
        }
        
        if ( media_index < 0 ) {
            return media_index_length + ( media_index % media_length );
        }
        
        return media_index;
    }
    
    private normalizeMacro( macro: number ) {
        return macro <= 254 ? macro : macro % 255 + 1;
    }
    
    private setCurrentMediaIndex( index: number ) {
        this._current_media_index = this.normalizeMediaIndex( this.current_playlist, index );
    }
    
    public get current_playlist(): IPlaylist {
        return this._current_playlist;
    }
    
    public get current_media_index(): number {
        return this._current_media_index;
    }
    
    public get state(): IState {
        if ( this._paused ) {
            return 'Paused';
        }
        
        if ( this._wait_for_take_off ) {
            return 'WaitingForTakeOff';
        }
        
        return 'Playing';
    }
    
    public get media_runtime(): number {
        const media_runtime = timer.currentMicroTickSinceStartup - this._current_media_begin;
        
        return media_runtime * 10;
    }
}
