import { SerialTimer } from 'shared-backend-utils';

const timer = new SerialTimer("/dev/tty.usbserial-120", {
  handleFaultyTick: 'Replace',
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
})

timer.onMicroTick.subscribe(value => {
  console.log(value.tick + " " + value.discrepancy_since_last_tick)
})

timer.enable()