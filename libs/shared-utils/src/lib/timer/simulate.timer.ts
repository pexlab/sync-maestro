import { ITimerSettings } from '@sync-maestro/shared-interfaces';
import { Timer } from './timer';
export class SimulateAdapter extends Timer{

  private microInterval?: ReturnType<typeof setInterval>;
  
  constructor(settings: ITimerSettings) {
    super(settings);
  }

  public override enable(): boolean {
    
    const enabled = super.enable();
    
    if(!enabled){
      return false;
    }
    
    let macro = 1;
    let micro = 1;
    
    let b = false;
    let a = false

    this.microInterval = setInterval(() => {
      if(micro > 100){
        micro = 1;
        
        if(macro > 254){
          macro = 1;
        }
        
        this.data(0x00);
        this.data(macro);
        
        macro++;
        
        return;
      }
      
      if(micro === 12 && !a){
        micro = 10;
        a = true
      }
      
      if(micro === 10 && !b){
        micro = 11;
        b = true;
      }
      
      this.data(0xFF);
      this.data(micro);
      
      micro++;
    }, 10);
    
    return true;
  }

  public override disable(): boolean{
    const disabled = super.disable();
    
    if(!disabled){
      return false;
    }

    if (this.microInterval) {
      clearInterval(this.microInterval);
    }
    
    return true;
  }
}
