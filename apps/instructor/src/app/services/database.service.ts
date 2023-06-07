import Keyv from 'keyv';
import * as process from 'process';

export class DatabaseService {
    
    private keyv = new Keyv( 'sqlite://' + process.cwd() + '/instructor.sqlite' );
    
    public async set( key: string, value: unknown ) {
        await this.keyv.set( key, value );
    }
    
    public async get( key: string ) {
        return await this.keyv.get( key );
    }
    
    public async delete( key: string ) {
        await this.keyv.delete( key );
    }
    
    public async clear() {
        await this.keyv.clear();
    }
}

export const databaseService = new DatabaseService();