import { Subject } from 'rxjs';

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