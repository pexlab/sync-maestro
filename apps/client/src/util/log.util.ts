import { Logger } from '@nestjs/common';

export const logger = {
    mpvProcess  : new Logger( 'Mpv - Process' ),
    mpvSocket   : new Logger( 'Mpv - Socket' ),
    mpv         : new Logger( 'Mpv' ),
    obeyerSocket: new Logger( 'Obeyer - Socket' ),
    obeyer      : new Logger( 'Obeyer' ),
};