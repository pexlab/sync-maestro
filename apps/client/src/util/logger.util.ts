import { ReadableNumber } from '@sync-maestro/shared-utils';
import chalk from 'chalk';
import { format } from 'date-fns';
import { timer } from '../main';

export class Logger {
    
    private prefix: string | undefined;
    
    constructor( prefix?: string ) {
        this.prefix = prefix;
    }
    
    private formatMessage( message: string[], prefix?: string ) {
        
        const currentTime = format( new Date(), 'HH\':\'mm\' \'ss\'s \'SS\'ms\'' );
        
        const currentTick = ReadableNumber( timer.currentMacroTick, {
            sign     : 'negative-only',
            separator: false,
            padding  : '000'
        } ) + ' Macro, ' + ReadableNumber( timer.currentMicroTick, {
            sign     : 'negative-only',
            separator: false,
            padding  : '000'
        } ) + ' Micro';
        
        return (
            chalk.bgYellowBright(
                chalk.black(
                    'Timer at ' + currentTick + ' | Clock at ' + currentTime + ( prefix ? ' | ' + prefix + chalk.reset( '\n' ) : chalk.reset( '\n' ) )
                )
            ) + message.join( ' ' )
        ).trim() + '\n';
    }
    
    public log( ...message: unknown[] ) {
        console.log( chalk.green( this.formatMessage( message.map(e => String(e)), this.prefix ) ) );
    }
    
    public warn( ...warning: unknown[] ) {
        console.warn( chalk.yellow( this.formatMessage( warning.map(e => String(e)), this.prefix ) ) );
    }
    
    public error( ...error: unknown[] ) {
        console.error( chalk.red( this.formatMessage( error.map(e => String(e)), this.prefix ) ) );
    }
}