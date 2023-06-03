import { Controller } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
    
    constructor( private readonly appService: AppService ) {
        
        this.appService.generateEqualized( 'demo.mp4', {
            type    : 'Audio',
            device  : 'WiredSpeaker',
            bitrate : 'Compressed',
            name    : 'test',
            equalize: {
                preamp : -4.4,
                filters: [
                    {
                        type     : 'Peaking',
                        frequency: 52,
                        bandwidth: 0.334,
                        gain     : 12.8
                    },
                    {
                        'type'     : 'LowShelf',
                        'frequency': 105,
                        'bandwidth': 0.700,
                        'gain'     : 7.7
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 608,
                        'bandwidth': 0.890,
                        'gain'     : 0.7
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 1010,
                        'bandwidth': 2.420,
                        'gain'     : -0.8
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 1290,
                        'bandwidth': 2.100,
                        'gain'     : -1.3
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 1810,
                        'bandwidth': 4.040,
                        'gain'     : 1.0
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 2200,
                        'bandwidth': 3.260,
                        'gain'     : 1.4
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 5040,
                        'bandwidth': 2.350,
                        'gain'     : -4.3
                    },
                    {
                        'type'     : 'Peaking',
                        'frequency': 9960,
                        'bandwidth': 0.860,
                        'gain'     : 4.7
                    },
                    {
                        'type'     : 'HighShelf',
                        'frequency': 10000,
                        'bandwidth': 0.700,
                        'gain'     : -4.7
                    }
                ]
            }
        } );
    }
}
