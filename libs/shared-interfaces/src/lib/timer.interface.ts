import { Subject } from 'rxjs';

export interface Timer {
    macroTick: Subject<{ tick: number, ticks_since_startup: number }>;
    microTick: Subject<{ tick: number, ticks_since_startup: number }>;
    currentMacroTick: number;
    currentMicroTick: number;
    currentMacroTickSinceStartup: number;
    currentMicroTickSinceStartup: number;
    enable(): void;
    disable(): void;
    enabled: boolean;
}