type MapChangeListener<K, V> = ( map: Map<K, V> ) => void;

export class ObservableMap<K, V> {
    
    private map: Map<K, V>;
    private listeners: MapChangeListener<K, V>[];
    
    constructor() {
        this.map       = new Map<K, V>();
        this.listeners = [];
    }
    
    private notifyListeners(): void {
        this.listeners.forEach( ( listener ) => listener( this.map ) );
    }
    
    public get( key: K ): V | undefined {
        return this.map.get( key );
    }
    
    public set( key: K, value: V ): void {
        this.map.set( key, value );
        this.notifyListeners();
    }
    
    public delete( key: K ): boolean {
        const result = this.map.delete( key );
        if ( result ) {
            this.notifyListeners();
        }
        return result;
    }
    
    public subscribe( listener: MapChangeListener<K, V> ): void {
        this.listeners.push( listener );
        listener( new Map<K, V>( this.map ) );
    }
    
    public unsubscribe( listener: MapChangeListener<K, V> ): void {
        const index = this.listeners.indexOf( listener );
        if ( index !== -1 ) {
            this.listeners.splice( index, 1 );
        }
    }
}