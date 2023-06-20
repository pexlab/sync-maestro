import { format } from 'date-fns';
import { timer } from '../main';
import {log} from './console.util';

export class Logger {

    private prefix: string | undefined;

    constructor( prefix?: string ) {
        this.prefix = prefix;
    }

    private messagePrefix( prefix?: string ) {

        const now = new Date();

        const oClock = format( now, 'HH\':\'mm\':\'ss\':\'SS' );

        return `{black-fg}{yellow-bg}{bold} ℹ ` +
          ( prefix ? `${prefix}  ×  ` : ``) +
          `Conductor at ${timer.currentMacroTick}M:${timer.currentMicroTick}µ  ×  ` +
          `${oClock} o'clock` +
          `\n{/bold}{/yellow-bg}{/black-fg}`;
    }


    public log( ...message: unknown[] ) {
        log( '{bright-grey-fg}' +  this.messagePrefix( this.prefix ) + message.map(e => String(e)).join(" ") + '{/bright-grey-fg}\n\n'  );
    }

    public success( ...message: unknown[] ) {
        log( '{bright-green-fg}' +  this.messagePrefix( this.prefix ) + "✓ " + message.map(e => String(e)).join(" ") + '{/bright-green-fg}\n\n'  );
    }

    public warn( ...warning: unknown[] ) {
        log( '{bright-yellow-fg}' +  this.messagePrefix( this.prefix ) + "⚠ "+ warning.map(e => String(e)).join(" ") + '{/bright-yellow-fg}\n\n'  );

    }

    public error( ...error: unknown[] ) {
        log( '{bright-red-fg}' +  this.messagePrefix( this.prefix ) + "✖ " + error.map(e => String(e)).join(" ") + '{/bright-red-fg}\n\n'  );
    }
}