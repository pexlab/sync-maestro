import { Subject } from 'rxjs';
import { z } from 'zod';

export const ZMacroTick = z.nan().or( z.number().int().min( 0 ).max( 255 ) );

export const ZMicroTick = z.nan().or( z.number().int().min( 0 ).max( 100 ) );

export interface Timer {
    onTick: Subject<void>;
    onMacroTick: Subject<{ tick: number, ticks_since_startup: number }>;
    onMicroTick: Subject<{ tick: number, ticks_since_startup: number }>;
    currentMacroTick: number;
    currentMicroTick: number;
    currentMacroTickSinceStartup: number;
    currentMicroTickSinceStartup: number;
    enable(): void;
    disable(): void;
    enabled: boolean;
}