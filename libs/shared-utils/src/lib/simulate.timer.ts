import {Timer} from '@sync-maestro/shared-interfaces';
import {Subject} from 'rxjs';

export class SimulateAdapter implements Timer {

  public onTick = new Subject<void>;
  public onMacroTick = new Subject<{ tick: number; ticks_since_startup: number }>;
  public onMicroTick = new Subject<{ tick: number; ticks_since_startup: number }>;

  private macroInterval?: ReturnType<typeof setInterval>;
  private microInterval?: ReturnType<typeof setInterval>;

  private _enabled = false;

  private _macroTick = 1;
  private _microTick = 0;
  private _macroTicksSinceStartup = 0;
  private _microTicksSinceStartup = 0;

  public get currentMacroTick(): number {
    return this._macroTick;
  }

  public get currentMicroTick(): number {
    return this._microTick;
  }

  public get currentMacroTickSinceStartup(): number {
    return this._macroTicksSinceStartup;
  }

  public get currentMicroTickSinceStartup(): number {
    return this._microTicksSinceStartup;
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public enable(): void {

    if (this._enabled) {
      return;
    }

    this.microInterval = setInterval(() => {
      this._microTick = this._microTick === 99 ? 0 : this._microTick + 1;
      this._microTicksSinceStartup++;

      this.onMicroTick.next({
        tick: this._microTick,
        ticks_since_startup: this._microTicksSinceStartup
      });

      if (this._microTick === 0) {
        this._macroTick = this._macroTick === 254 ? 1 : this._macroTick + 1;
        this._macroTicksSinceStartup++;

        this.onMacroTick.next({
          tick: this._macroTick,
          ticks_since_startup: this._macroTicksSinceStartup
        });
      }

      this.onTick.next();

    }, 10);
  }

  public disable(): void {

    if (!this._enabled) {
      return;
    }

    if (this.macroInterval) {
      clearInterval(this.macroInterval);
    }

    if (this.microInterval) {
      clearInterval(this.microInterval);
    }

    this._macroTick = 1;
    this._microTick = 0;
    this._macroTicksSinceStartup = 0;
    this._microTicksSinceStartup = 0;
  }
}
