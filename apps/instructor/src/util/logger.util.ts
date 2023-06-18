import { ReadableNumber } from '@sync-maestro/shared-utils';
import chalk from 'chalk';
import { format } from 'date-fns';
import { clientManager, timer } from '../main';

function formatMessage( message: string[], prefix?: string ) {
    
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
                'Timer at ' + currentTick + ' | Clock at ' + currentTime + ( prefix ? ' ' + prefix + chalk.reset( '\n' ) : chalk.reset( '\n' ) )
            )
        ) + message.join( ' ' )
    ).trim() + '\n';
}

export function logMessage( ...message: string[] ) {
    console.log( chalk.green( formatMessage( message ) ) );
}

export function logWarning( ...warning: string[] ) {
    console.warn( chalk.yellow( formatMessage( warning ) ) );
}

export function logError( ...error: string[] ) {
    console.error( chalk.red( formatMessage( error ) ) );
}

export function logClient( type: 'neutral' | 'warning' | 'error', client: [ string ] | [ string, string | undefined ] | [ undefined, string ], ...message: string[] ) {
    
    const [ session, name ] = client;
    let displayName: string | undefined;
    
    if ( name ) {
        displayName = clientManager.clientNameToConfigMap.get( name )?.displayName;
    }
    
    const prefix: string[] = [];
    
    if ( session !== undefined) {
        prefix.push( 'Session ' + session );
    }
    
    if ( name !== undefined ) {
        prefix.push( 'Name ' + name);
    }
    
    if ( displayName !== undefined ) {
        prefix.push( 'Display-Name ' + displayName );
    }
    
    const prefixString = '| ' + prefix.reverse().join( ' | ' );
    
    switch ( type ) {
        case 'neutral':
            console.log( chalk.green( formatMessage( message, prefixString ) ) );
            break;
        case 'warning':
            console.warn( chalk.yellow( formatMessage( message, prefixString ) ) );
            break;
        case 'error':
            console.error( chalk.red( formatMessage( message, prefixString ) ) );
            break;
    }
}