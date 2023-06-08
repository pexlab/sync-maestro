import {z} from 'zod';
import {spawnSync} from "child_process";
import * as path from "path";
import * as os from "os";

export const ZMedia = z.object({
  name: z.string(),
  file_path: z.string()
}).transform((obj) => {

  const ffmpegArgs = [
    '-v', 'error',
    '-show_entries',
    'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    path.join(os.homedir(), obj.file_path)
  ];

  const duration = +spawnSync( 'ffprobe', ffmpegArgs ).stdout.toString();
  const duration_micro = Math.round(duration * 1000 / 10);

  return {
    ...obj,
    duration,
    duration_micro
  }
});

export type IPlaylist = z.infer<typeof ZPlaylist>;
export type IMedia = z.infer<typeof ZMedia>;
export type IMediaPlaylist = z.infer<typeof ZMediaPlaylist>;
export type IClientInstruction = z.infer<typeof ZClientInstruction>;

export const ZMediaPlaylist = z.object({
  duration: z.number(),
  shuffle: z.boolean(),
  playlist_id: z.number()
})

export const ZPlaylist = z.object({
  id: z.number(),
  name: z.string(),
  media: /*ZMedia.or(ZMediaPlaylist).array()*/ ZMedia.array()
});

export const ZTypes = z.enum( [
  'Video'
] );

export const ZStates = z.enum( [
  'Paused',
  'Playing'
] );

export const ZClientInstruction = z.object({
  at_macro_tick: z.number(),
  at_micro_tick: z.number(),
  type: ZTypes,
  media: z.object({
    state: ZStates,
    url: z.string(),
    be_at: z.number().nonnegative()
  })
});
