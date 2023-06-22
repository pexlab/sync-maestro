import { parseZodFromJSON } from '@sync-maestro/shared-utils';
import fs from 'fs';
import { IPlaylist, IState, ZPlaylist } from './interface/media.interface';
import { clientManager, timer } from './main';
import { Bazaar } from './util/bazaar.util';
import { logMessage } from './util/logger.util';

export class Instructor {
    
    private _playlists: IPlaylist[] = [];
    
    private _current_playlist!: IPlaylist;
    
    private _current_media_index = 0;
    private _current_media_begin = 0;
    
    private _wait_for_take_off = false;
    private _paused            = true;
    
    constructor() {
        
        this.loadPlaylistsFromFile( Bazaar.getResource( 'playlist.json' ) );
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
        
        clientManager.clientNameToReadyForTakeoff.subscribe( ( map ) => {
            if ( Array.from( map.values() ).every( val => val ) ) {
                logMessage( 'All clients became ready for takeoff' );
                this.takeOff();
            }
        } );
    }
    
    private takeOff() {
        
        if ( this._paused ) {
            return;
        }
        
        if ( !this._wait_for_take_off ) {
            return;
        }
        
        logMessage( 'Taking off...' );
        
        const macro = timer.currentMacroTick;
        const micro = timer.currentMicroTick;
        
        const resume_macro = this.normalizeMacro( macro + 2 );
        const resume_micro = 0;
        
        const resume_offset = ( ( resume_macro - macro ) * 100 ) - micro;
        
        this._current_media_begin += resume_offset;
        this._wait_for_take_off = false;
        
        for ( const [ , client ] of clientManager.clientNameWithControllers ) {
            client.resume( resume_macro, resume_micro );
        }
    }
    
    private prepareForTakeOff() {
        
        const micro_since_startup = timer.currentMicroTickSinceStartup;
        
        const current_media = this.current_playlist.media[ this._current_media_index ];
        
        let media_runtime = micro_since_startup - this._current_media_begin;
        
        if ( media_runtime < 0 ) {
            media_runtime = 0;
        }
        
        const be_at = ( media_runtime * 10 ) / 1000;
        
        this._wait_for_take_off = true;
        
        logMessage( 'Preparing for takeoff...' );
        
        for ( const [ , client ] of clientManager.clientNameWithControllers ) {
            client.pause( be_at, current_media.file_path );
        }
        
        logMessage( 'Preparations for takeoff completed' );
    }
    
    public toggle() {
        if ( this._paused ) {
            this.resume();
            return;
        }
        
        this.pause();
    }
    
    public resume() {
        
        if ( !this._paused ) {
            return;
        }
        
        logMessage( 'Resuming...' );
        
        this._paused = false;
        
        this.prepareForTakeOff();
    }
    
    public pause() {
        
        logMessage( 'Pausing...' );
        
        this._paused = true;
        
        const micro_since_startup = timer.currentMicroTickSinceStartup;
        
        const current_media = this.current_playlist.media[ this._current_media_index ];
        
        let media_runtime = micro_since_startup - this._current_media_begin;
        
        if ( media_runtime < 0 ) {
            media_runtime = 0;
        }
        
        const be_at = ( media_runtime * 10 ) / 1000;
        
        for ( const [ , client ] of clientManager.clientNameWithControllers ) {
            client.pause( be_at, current_media.file_path );
        }
    }
    
    public next() {
        
        logMessage( 'Skipping...' );
        
        this._current_media_begin = timer.currentMicroTickSinceStartup;
        
        this.setCurrentMediaIndex( this.current_media_index + 1 );
        
        if ( this._paused ) {
            return;
        }
        
        this.prepareForTakeOff();
    }
    
    public prev() {
        
        logMessage( 'Reversing...' );
        
        this._current_media_begin = timer.currentMicroTickSinceStartup;
        
        this.setCurrentMediaIndex( this.current_media_index - 1 );
        
        if ( this._paused ) {
            return;
        }
        
        this.prepareForTakeOff();
    }
    
    public scrub( time: number ) {
        
        logMessage( 'Scrubbing...' );
        
        const micro_since_startup = timer.currentMicroTickSinceStartup;
        
        const current_media = this.current_playlist.media[ this._current_media_index ];
        
        if ( time > current_media.duration || time < 0 ) {
            return;
        }
        
        const time_in_micro = time * 100;
        
        const parsedTime = (time * current_media.duration_micro) / 100
        
        
        
        this._current_media_begin = micro_since_startup - parsedTime;
        
        if ( this._paused ) {
            return;
        }
        
        this.prepareForTakeOff();
    }
    
    private loadPlaylistsFromFile( path: string ) {
        this._playlists = parseZodFromJSON(
            ZPlaylist.array(),
            fs.readFileSync( path, 'utf-8' )
        );
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
