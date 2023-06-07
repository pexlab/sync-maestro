import { Logger } from '@nestjs/common';

export const logClient = new Logger( 'Client' );
export const logMPV    = new Logger( 'MPV' );
export const logSocket = new Logger( 'Socket' );