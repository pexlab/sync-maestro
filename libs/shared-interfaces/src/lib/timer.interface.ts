import { z } from 'zod';

const ZThresholdSettings = z.object( {
    error  : z.number().optional().default( 20 ),
    warning: z.number().optional().default( 5 ),
    disable: z.number().optional().default(50)
} );

const ZDiscrepancySettings = z.object( {
    exceedThreshold  : ZThresholdSettings,
    undercutThreshold: ZThresholdSettings
} );

export const ZTimerSettings = z.object( {
    macroDiscrepancy             : ZDiscrepancySettings,
    microDiscrepancy             : ZDiscrepancySettings,
    handleFaultyTick: z.enum( [
            'Skip',
            'Replace',
            'None'
        ]
    )
} );

export type ITimerSettings = z.infer<typeof ZTimerSettings>;

export enum TimerError {
    MacroDiscrapancyTooLow,
    MicroDiscrapancyTooLow,
    MacroDiscrapancyTooHigh,
    MicroDiscrapancyTooHigh,
    AutoDisablingTimer
}

export enum TimerWarning {
    MacroDiscrapancyTooLow,
    MicroDiscrapancyTooLow,
    MacroDiscrapancyTooHigh,
    MicroDiscrapancyTooHigh,
}