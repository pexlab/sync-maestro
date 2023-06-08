import kebabCase from 'just-kebab-case';
import replaceAll from 'just-replace-all';

export function Capitalize( string: string ) {
    return string.replace(/\b\w/g, l => l.toUpperCase())
}

export function NumberSign( number: number, option?: 'always' | 'negative-only' | 'positive-only', spacing = true ) {
    
    const suffix = spacing ? ' ' : '';
    
    switch ( option ?? 'always' ) {
        
        case 'always':
            return number === 0 ? '±' + suffix : number > 0 ? '+' + suffix : '-' + suffix;
        
        case 'positive-only':
            return number > 0 ? '+' + suffix : '';
        
        case 'negative-only':
            return number < 0 ? '-' + suffix : '';
    }
}

export function ReadableNumber( number: number, options?: {
    sign?: 'always' | 'never' | 'negative-only' | 'positive-only',
    padding?: string | [ number, string ],
    unit?: string,
    separator?: boolean
} ): string {
    
    const o = {
        sign     : options?.sign ?? 'always',
        padding  : options?.padding,
        unit     : options?.unit,
        separator: options?.separator ?? true
    };
    
    let result = '';
    
    if ( o.separator ) {
        result = Math.abs( number ).toLocaleString();
    } else {
        result = Math.abs( number ).toString();
    }
    
    if ( o.padding ) {
        if ( typeof o.padding === 'string' ) {
            result = result.padStart( o.padding.length, o.padding );
        } else {
            result = result.padStart( o.padding[ 0 ], o.padding[ 1 ] );
        }
    }
    
    if ( o.sign && o.sign !== 'never' ) {
        result = NumberSign( number, o.sign, true ) + result;
    }
    
    if ( o.unit ) {
        result += ' ' + o.unit;
    }
    
    return result;
}

export function ReadableCase( string: string | undefined ) {
    return string ? Capitalize( replaceAll( kebabCase( string ), '-', ' ' ) ) : '';
}