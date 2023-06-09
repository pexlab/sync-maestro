import { z } from 'zod';

export const ZCommand = {
    
    LoadFile: z.object( {
        type      : z.literal( 'LoadFile' ),
        identifier: z.string()
    } ),
    
    Scrub: z.object( {
        type    : z.literal( 'Scrub' ),
        position: z.number()
    } ),
    
    Pause: z.object( {
        type: z.literal( 'Pause' )
    } ),
    
    Resume: z.object( {
        type: z.literal( 'Resume' )
    } ),
    
    get Any() {
        return z.discriminatedUnion( 'type', [
            this.LoadFile,
            this.Scrub,
            this.Pause,
            this.Resume
        ] );
    }
};