export function PromiseLoop( promise: () => Promise<unknown>, interval: number ) {
    
    let stop = false;
    
    const loop = async () => {
        await promise();
        if ( !stop ) {
            setTimeout( loop, interval );
        }
    };
    
    loop().then();
    
    return () => {
        stop = true;
    };
}