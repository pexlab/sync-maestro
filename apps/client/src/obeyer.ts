import { ZCommand } from '@sync-maestro/shared-interfaces';
import { SimulateAdapter } from '@sync-maestro/shared-utils';
import { z } from 'zod';
import { UARTAdapter } from '../../../libs/shared-utils/src/lib/timer/uart.timer';
import { logMPV } from './logger';
import { MPV } from './mpv';
import * as path from "path";
import * as os from "os";

export class Obeyer {

    private mpv = new MPV();

    private timer = new UARTAdapter('/dev/tty.usbserial-0001');

    public commands: z.infer<typeof ZCommand>[] = [];

    private currentURL: string | undefined;

    constructor() {

        this.mpv.connect().then( () => {

            this.mpv.messages.subscribe( ( message ) => {

                if ( message.event && typeof message.event === 'string' ) {

                    if ( message.event === 'property-change' ) {
                        return;
                    }

                    logMPV.debug( message.event );

                } else if ( message.request_id === undefined ) {
                    logMPV.debug( message );
                }
            } );

            let block = false;

            this.timer.enable();

            this.timer.onTick.subscribe( async () => {

                if ( block ) {
                    return;
                }

                const macro = this.timer.currentMacroTick;
                const micro = this.timer.currentMicroTick;

                const currentCommand = this.commands.filter( command => {
                    return command.at_macro_tick === macro; // TODO: Micro as well
                } ).at(-1);

                if ( !currentCommand ) {
                    return;
                }

              console.log(currentCommand)

                if ( currentCommand.media.url !== this.currentURL ) {

                    block = true;

                    await this.mpv.play( path.join(os.homedir(), currentCommand.media.url) );
                    await this.mpv.pause();
                    await this.mpv.scrub( currentCommand.media.be_at );

                    this.currentURL = currentCommand.media.url;

                    block = false;

                    return;
                }

                if ( currentCommand.media.state === 'Paused' ) {

                    block = true;

                    await this.mpv.pause();
                    await this.mpv.scrub( currentCommand.media.be_at );

                    block = false;

                    return;
                }

                block = true;

                await this.mpv.resume();

                block = false;
            } );
        } );
    }
}
