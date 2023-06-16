export function parseJSON( object: string ) {
    try {
        console.log( 'Parsing JSON' );
        return JSON.parse( object );
    } catch ( error ) {
        console.error( 'Error parsing:\n' + object );
        throw error;
    }
}