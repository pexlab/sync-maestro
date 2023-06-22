import { z } from 'zod';
import { ZDeviceConfig, ZRegisteredDevice } from './device.interface';
import { ZMacroTick, ZMicroTick } from './timer.interface';

export const ZServerToControllerCommand = z.discriminatedUnion( 'type', [
    z.object( {
        
        type: z.literal( 'Info' ),
        
        macro                          : ZMacroTick,
        macro_since_startup            : z.number().int(),
        macro_occurrence               : z.number().positive().int(),
        macro_discrepancy              : z.number(),
        macro_since_startup_discrepancy: z.number(),
        
        micro                          : ZMicroTick,
        micro_since_startup            : z.number().int(),
        micro_occurrence               : z.number().positive().int(),
        micro_discrepancy              : z.number(),
        micro_since_startup_discrepancy: z.number(),
        
        current_media: z.object( {
            name    : z.string(),
            duration: z.number().int(),
            position: z.number().int(),
            paused  : z.boolean(),
            waiting : z.boolean()
        } ),
        
        devices: ZRegisteredDevice.array()
    } )
] );

export type IServerToControllerCommand = z.infer<typeof ZServerToControllerCommand>;

export const ZServerToClientCommand = z.discriminatedUnion( 'type', [
    z.object( {
        type : z.literal( 'ResumeWhen' ),
        macro: ZMacroTick,
        micro: ZMicroTick
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

export const ZClientToControlCommand = z.discriminatedUnion( 'type', [
    z.object( {
        type: z.literal( 'TogglePlayback' )
    } ),
    z.object( {
        type: z.literal( 'Resume' )
    } ),
    z.object( {
        type: z.literal( 'Pause' )
    } ),
    z.object( {
        type: z.literal( 'Next' )
    } ),
    z.object( {
        type: z.literal( 'Previous' )
    } ),
    z.object( {
        type         : z.literal( 'Scrub' ),
        be_at_percent: z.number().min( 0 ).max( 1 )
    } ),
    z.object( {
        type  : z.literal( 'ConfigureDevice' ),
        name  : z.string().min( 1 ),
        config: ZDeviceConfig
    } )
] );

export type IClientToControlCommand = z.infer<typeof ZClientToControlCommand>;