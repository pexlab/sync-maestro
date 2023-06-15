import { z } from 'zod';

export const ZServerToClientCommand = z.discriminatedUnion( 'type', [
    z.object( {
        type : z.literal( 'ResumeWhen' ),
        macro: z.number().min( 0 ).max( 255 ),
        micro: z.number().min( 0 ).max( 100 )
    } ),
    z.object( {
        type : z.literal( 'PauseImmediatelyAt' ),
        be_at: z.number().min( 0 ),
        url  : z.string().min( 1 )
    } )
] );

export type IServerToClientCommand = z.infer<typeof ZServerToClientCommand>;

export const ZClientToServerCommand = z.discriminatedUnion( 'type', [
    z.object( {
        type: z.literal( 'Registration' ),
        name: z.string().min( 1 )
    } ),
    z.object( {
        type : z.literal( 'ReadyForTakeoff' ),
        state: z.boolean()
    } )
] );

export type IClientToServerCommand = z.infer<typeof ZClientToServerCommand>;