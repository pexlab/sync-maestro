import { Logger } from '@nestjs/common';

export const logClient        = new Logger( 'Client' );
export const logMpvProcess    = new Logger( 'mpv - Process' );
export const logMpvIpc        = new Logger( 'mpv - IPC' );
export const logCommunication = new Logger( 'Communication' );