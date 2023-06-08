import fs from "fs";
import path from "path";
import process from "process";
import {IClientInstruction, IPlaylist, ZPlaylist} from "@sync-maestro/shared-interfaces";
import {SimulateAdapter} from "@sync-maestro/shared-utils";
import {socketService} from "./services/socket.service";
import {clientManagerService} from "./services/client-manager.service";

export class Instructor{

  private playlists: IPlaylist[] = [];

  private current_playlist!: IPlaylist;
  private current_playlist_begin = 0;

  constructor() {
    this.loadPlaylistsFromFile(path.join(process.cwd(), 'apps', 'instructor', 'src', 'assets', 'playlist.json'))
    this.setCurrentPlaylist(0);

    const timer = new SimulateAdapter();
    timer.enable();

    timer.onMacroTick.subscribe(value => {
      const macro = value.tick;
      const micro_since_startup = timer.currentMicroTickSinceStartup;

      for (const [key, value] of clientManagerService.clientList) {

        const instructions = this.prepare(this.current_playlist, this.current_playlist_begin, macro, micro_since_startup, value.offset);

        socketService.sendClient(key, instructions);
      }
    })
  }

  private loadPlaylistsFromFile(path: string){
    const data = fs.readFileSync(path, 'utf-8');

    const json = JSON.parse(data);

    this.playlists = ZPlaylist.array().parse(json.playlists);
  }

  private setCurrentPlaylist(id: number){
    for (const playlist of this.playlists) {
      if(playlist.id === id){
        this.current_playlist = playlist;
        return;
      }
    }
  }

  private getCurrentMedia(playlist: IPlaylist, current_playlist_begin: number, current_micro_since_startup: number): {media_index: number, media_runtime: number, media_remaining: number}{
    const playlist_runtime = current_micro_since_startup - current_playlist_begin;

    let media_index = 0;
    let media_runtime = 0;
    let media_remaining = 0;

    let time = 0;
    for(;;media_index++){
      const media = playlist.media[this.normalizeMediaIndex(playlist, media_index)];

      if(time + media.duration_micro > playlist_runtime){
        media_runtime = playlist_runtime - time;
        media_remaining = media.duration_micro - media_runtime;
        break;
      }

      time += media.duration_micro;
    }

    return {
      media_index,
      media_runtime,
      media_remaining
    }
  }

  private prepare(playlist: IPlaylist, current_playlist_begin: number, current_macro_tick: number, current_micro_since_startup: number, offset: number){

    let micro_since_startup = current_micro_since_startup;

    //offset in micro
    current_playlist_begin -= offset / 10;

    const instructions: IClientInstruction[] = [];

    for (let m = current_macro_tick; m <= 254 + current_macro_tick - 1; m++) {
      const macro = m > 254 ? (m - 254) : m;

      let current_media = this.getCurrentMedia(playlist, current_playlist_begin, micro_since_startup);
      let media = playlist.media[this.normalizeMediaIndex(playlist, current_media.media_index)];

      instructions.push({
        at_macro_tick: macro,
        at_micro_tick: 0,
        type: 'Video',
        media: {
          state: 'Playing',
          be_at: current_media.media_runtime * 10 / 1000,
          url: media.file_path
        }
      })

      if(current_media.media_remaining < 100){
        const remain = current_media.media_remaining;

        current_media = this.getCurrentMedia(playlist, current_playlist_begin, micro_since_startup + current_media.media_remaining);
        media = playlist.media[this.normalizeMediaIndex(playlist, current_media.media_index)];


        instructions.push({
          at_macro_tick: macro,
          at_micro_tick: remain,
          type: 'Video',
          media: {
            state: 'Playing',
            be_at: 0,
            url: media.file_path
          }
        })
      }

      micro_since_startup += 100;
    }

    return instructions;
  }

  private normalizeMediaIndex(playlist: IPlaylist, media_index: number) {
    const media_length = playlist.media.length
    const media_index_length = media_length - 1;

    if (media_index > media_index_length) {
      return (media_index % media_length);
    }

    if (media_index < 0) {
      return media_index_length + (media_index % media_length);
    }

    return media_index;
  }

}
