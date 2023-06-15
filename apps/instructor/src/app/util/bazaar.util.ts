import * as path from 'path';
import * as process from 'process';
import { MainDirectory } from '../../main';

class BazaarUtil {
    
    public get isWindows() {
        return process.platform === 'win32';
    }
    
    public get isMac() {
        return process.platform === 'darwin';
    }
    
    public get isLinux() {
        return process.platform === 'linux';
    }
    
    public get isUnix() {
        return this.isMac || this.isLinux;
    }
    
    public getResource( ...resource: string[] ) {
        return path.join( MainDirectory, 'assets', ...resource );
    }
    
    private generatedStrings = new Set();
    
    public uniqueString( length: number ) {
        
        let result = '';
        
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        
        const charactersLength = characters.length;
        
        do {
            result = '';
            for ( let i = 0; i < length; i++ ) {
                result += characters.charAt( Math.floor( Math.random() * charactersLength ) );
            }
        } while ( this.generatedStrings.has( result ) );
        
        this.generatedStrings.add( result );
        
        return result;
    }
}

export const Bazaar = new BazaarUtil();