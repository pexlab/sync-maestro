import * as ip from 'ip';

export function FindFirstLan4( addresses: string[] ) {
    
    for ( let i = 0; i < addresses.length; i++ ) {
        
        const address = addresses[ i ];
        
        if ( ip.isPrivate( address ) && ip.isV4Format( address ) ) {
            return address;
        }
    }
    
    return null;
}
