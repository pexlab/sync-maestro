import { Timer } from './timer';

export class EmptyTimer extends Timer {
    
    constructor() {
        super( {
            handleFaultyTick: 'None',
            macroDiscrepancy: {
                exceedThreshold: {
                    disable: 0,
                    warning: 0,
                    error: 0
                },
                undercutThreshold:{
                    disable: 0,
                    warning: 0,
                    error: 0
                }
            },
            microDiscrepancy: {
                exceedThreshold: {
                    disable: 0,
                    warning: 0,
                    error: 0
                },
                undercutThreshold:{
                    disable: 0,
                    warning: 0,
                    error: 0
                }
            }
        });
    }
    
}
