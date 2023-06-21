export class MaxArray<T> extends Array<T> {
    
    constructor(public readonly max: number) {
        super();
    }
    
    public override unshift(value: T): number {
        if(this.length >= this.max){
            super.pop();
        }
        
        return super.unshift(value);
    }
    
    public override push(value: T): number {
        if(this.length >= this.max){
            super.shift();
        }
        
        return super.push(value);
    }
}