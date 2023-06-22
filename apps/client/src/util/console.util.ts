import blessed from 'blessed';
import { format } from 'date-fns';
import * as os from 'os';
import process from 'process';
import { Subject, take } from 'rxjs';
import { timer } from '../main';

const screen = blessed.screen( {
    smartCSR    : true,
    forceUnicode: true,
    fullUnicode : true,
    cursor      : {
        artificial: true,
        blink     : true,
        shape     : 'underline',
        color     : '#ffffff'
    }
} );

screen.title = 'Sync-Maestro';

const asciiArt = '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣄⢸⡆⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠂⢖⢘⢉⠒⡐⠁⢎⡐⠐⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢳⣽⢀⠀⡠⡀⠀⠀⠀⠀⠀⠀⠠⢎⢆⢡⡜⡡⣎⡉⢎⣊⠄⠸⡦⣄⡈⡐⠠⠀⠀⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⣐⣔⣔⣤⣦⢹⣇⢠⣻⠁⠀⠀⠀⠀⠀⠀⢸⡣⡲⡱⡝⣼⢡⢟⣵⣫⣓⢆⠹⡦⡈⠘⢂⢈⠃⠀⠀⠀⠀⠀⠀\n' +
    '⠳⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣹⡀⠁⢻⢗⡵⢢⡿⠀⠀⠀⠀⠀⠀⠀⢀⢏⢝⢙⣪⣊⣓⢯⢳⡿⣮⡿⣶⣮⡑⡡⠀⡌⠐⡄⠀⠀⠀⠀⠀\n' +
    '⠀⠈⠓⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣣⠀⣘⡕⠄⣿⡇⠀⠀⠀⠀⠀⠀⠀⠚⡵⡷⢡⠽⣿⣝⣿⣳⡽⣛⢿⣳⣷⡹⡜⢤⣈⢃⠂⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠑⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡘⢐⠅⢍⡺⣟⠄⠀⠀⠀⠀⠀⠀⠀⠀⢻⣡⡝⢮⠂⢆⢄⢦⠪⡕⡯⡳⣝⢎⡎⠂⢿⡨⠂⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠑⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣔⠕⡨⣢⢿⡕⠅⠀⠀⠀⠀⠀⠀⠀⠀⣏⢯⡿⢏⠳⣜⣯⣻⣳⡺⡘⡝⠸⣟⢾⡄⠱⡱⠁⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠙⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡔⢵⣝⠿⠈⠠⠀⠀⠀⠀⠀⠀⠀⠀⡷⣽⠾⣮⡷⣹⢞⣵⢯⣟⣼⡪⣐⡛⣃⡕⠠⠨⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢽⢣⡕⡵⣀⠀⣦⡀⠀⠀⠀⠀⠀⠀⢻⡺⡗⢷⢞⢷⡻⣮⡿⣯⣿⢧⣿⠊⡉⢎⢀⠇⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢆⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡁⠳⣵⣝⢮⣳⣾⣟⣞⢦⡀⠀⠀⠀⠀⠈⣷⣪⢷⡽⣯⣿⣾⢿⣟⣿⡝⡧⢢⠢⠐⡌⠀⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠨⡲⣻⣳⣿⣿⣾⡿⣷⣽⣣⣄⠀⠀⠀⠈⢳⡟⣾⣻⡷⣿⢿⣿⣻⣮⡻⠎⠓⢘⢀⠀⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠤⣷⣔⡠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢾⣿⣿⣻⣿⣿⣿⣿⣕⢿⣦⣄⠀⠀⠀⠹⣳⣽⣟⡿⣻⢝⡵⣃⣴⢖⡿⣩⣫⣣⠀⠀⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣻⣥⠹⣮⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢹⣿⣿⣯⣿⣿⣿⣿⣞⣿⣞⣧⠀⠀⢀⢏⡘⢏⠮⣳⢝⡾⣯⣯⢯⣾⣵⡳⣗⣟⣶⣄⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢎⣴⣯⣅⢻⣇⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⢿⣿⣾⣷⣿⡯⣆⠔⣕⣙⢎⢎⣷⡿⣿⣺⣻⣳⣷⣟⡿⣿⣮⢷⣿⣧⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠲⣿⡖⣿⡨⠥⡈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⡺⣻⠴⡧⣫⡿⣯⣟⢿⣷⣻⣟⣿⣮⢿⣯⡻⣷⣯⣻⢧⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣾⢑⡿⣖⢌⠢⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢯⣳⣯⣺⡪⣯⢻⣿⡼⣯⡿⣿⣻⣿⣟⣿⣿⡳⡄\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⢻⢮⣻⣽⡢⡣⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⣻⣿⣿⣾⣿⣽⣿⣮⢷⣯⢺⡵⣿⡯⣿⣷⢿⣷⣻⣿⢯⣿⡝⣦\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣝⢷⢽⡮⡃⠐⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣹⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣿⣯⣿⣿⣝⣿⣝⡿⣿⣯⢿⣿⣟⣿⣟⣮⢷\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢴⢋⡏⣎⢺⡢⡀⣼⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⡽⣽⠻⣿⣿⣿⣿⣿⣿⣿⢿⣯⣿⣞⡾⣷⣝⣿⣻⣞⣿⣿⣿⡿⣝⡯⣷\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⡃⡑⢵⡱⣝⢮⣾⣿⣿⣽⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⢯⡾⠃⢠⣿⣿⣷⣿⣿⣷⣿⣿⣿⣿⣾⣿⣿⣾⣿⣿⣿⣿⣿⣿⣿⣿⣟⡗\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠸⡸⣣⣿⣿⣿⣿⣿⣿⣯⡻⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣳⡿⠁⣰⣿⣿⣿⣽⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⣾⣮⣾⠃\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠻⣿⣿⣿⣿⣿⣿⣿⣿⡾⣻⢦⡀⠀⠀⠀⠀⣀⣾⣿⡿⣵⡿⠁⣼⣿⣿⣿⣿⣽⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣯⣯⣻⣽⡝⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣿⣟⣿⣿⣝⣯⢖⣤⣿⣿⣿⣿⢿⣽⡟⠃⣼⣿⣿⣿⣿⣯⣿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣵⠃⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⣿⣿⣿⣿⣾⣟⣿⣿⣿⣿⣻⡿⡿⠀⣼⣿⣿⣿⣿⣿⣽⣿⣻⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣿⣿⡻⣿⡇⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⢿⣿⣿⣿⣯⣿⣿⣻⣿⣯⣿⡿⠁⢰⣿⣿⣿⣿⣿⣯⣿⣻⣿⣿⣿⣿⡿⣿⣿⣿⣻⣿⣿⣿⣿⣿⣮⣿⣟⣽⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣻⡏⠀⠀⣿⣿⣿⡿⣷⣿⣾⢿⣿⢿⣾⣿⣽⣿⣿⣿⡿⣿⣿⢿⣿⣿⣿⣿⣿⣮⠃⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⠏⢀⠈⠀⣿⣿⣽⣿⣻⣷⣿⣿⣿⣿⣿⣯⣿⣾⣿⣿⣿⡷⡽⣿⣻⣿⣿⢿⣿⡗⠀⠀⠀⠀\n' +
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⠃⠄⡀⠂⠀⣿⡿⣷⣿⣿⣽⣿⣷⣿⣿⣾⢿⣾⣷⣿⣿⣿⣿⣯⡺⣿⣽⣿⣿⠟⠀⠀⠀⠀⠀';

const logoArt = ' ,-.                  .   ,             .          \n' +
    '(   `                 |\\ /|             |          \n' +
    ' `-.  . . ;-. ,-. --- | V | ,-: ,-. ,-. |-  ;-. ,-.\n' +
    '.   ) | | | | |       |   | | | |-\' `-. |   |   | |\n' +
    ' `-\'  `-| \' \' `-\'     \'   \' `-` `-\' `-\' `-\' \'   `-\'\n' +
    '      `-\'                                          \n';

const background = blessed.box( {
    top   : 0,
    left  : 0,
    width : '100%',
    height: '100%',
    style : {
        bg: '#0000ff',
        fg: '#ffffff'
    }
} );

const art = blessed.box( {
    bottom : 0,
    right  : 0,
    width  : 'shrink',
    height : 'shrink',
    content: asciiArt,
    style  : {
        fg: '#ffffff',
        bg: '#0000ff'
    }
} );

const logo = blessed.box( {
    left   : 'center',
    top    : 1,
    width  : 'shrink',
    height : 'shrink',
    content: logoArt,
    style  : {
        fg: '#ffffff',
        bg: '#0000ff'
    }
} );

const report = blessed.box( {
    top       : 9,
    left      : 3,
    width     : '60%-2',
    height    : '100%-13',
    style     : {
        fg    : '#ffffff',
        bg    : '#000000',
        border: {
            bg: '#313131'
        }
    },
    border    : {
        type: 'bg'
    },
    padding   : 1,
    keys      : true,
    mouse     : true,
    scrollable: true,
    focusable : true,
    tags      : true,
    scrollbar : {
        style: {
            bg: '#ffffff',
            fg: '#ff0000'
        }
    }
} );

const list = blessed.list( {
    top    : 9,
    left   : 3,
    width  : '60%-2',
    height : '100%-13',
    style  : {
        selected: {
            bg: '#ff0000',
            fg: '#ffffff'
        },
        fg      : '#ffffff',
        bg      : '#000000',
        border  : {
            bg: '#313131'
        }
    },
    border : {
        type: 'bg'
    },
    padding: 1
} );

const listDescription = blessed.box( {
    bottom : 0,
    left   : 0,
    right  : 0,
    height : 'shrink',
    style  : {
        fg    : '#ffffff',
        bg    : '#000000',
        border: {
            fg: '#ffffff',
            bg: '#000000'
        }
    },
    border : {
        type: 'line'
    },
    padding: 1,
    tags   : true
} );

list.append( listDescription );

list.hide();
listDescription.hide();

const mainLabel = blessed.box( {
    parent   : screen,
    top      : 8,
    left     : 2,
    width    : '60%',
    height   : '100%-11',
    content  : '',
    tags     : true,
    style    : {
        fg: '#000000',
        bg: '#ffffff'
    },
    shadow   : true,
    focusable: false
} );

const optionSelected = new Subject<string>();

const optionHovered = new Subject<string>();

let selected = 0;
let listOptions: [ string, string, string | undefined ][];

list.on( 'keypress', ( ch, key ) => {
    
    if ( key.name === 'enter' ) {
        optionSelected.next( listOptions[ selected ][ 0 ] );
        return;
    }
    
    if ( key.name === 'up' || key.name === 'down' ) {
        
        if ( key.name === 'up' ) {
            selected--;
        } else {
            selected++;
        }
        
        if ( selected < 0 ) {
            selected = listOptions.length - 1;
        } else if ( selected >= listOptions.length ) {
            selected = 0;
        }
        
        list.select( selected );
        
        optionHovered.next( listOptions[ selected ][ 0 ] );
    }
} );

const statsLabel = blessed.box( {
    parent   : screen,
    top      : 8,
    right    : 4,
    width    : '35%',
    height   : '25%',
    content  : '{center}{bold}Statistics{/bold}{/center}',
    tags     : true,
    style    : {
        fg: '#000000',
        bg: '#ffffff'
    },
    shadow   : true,
    focusable: false
} );

const stats = blessed.box( {
    top    : 9,
    right  : 5,
    width  : '35%-2',
    height : '25%-2',
    tags   : true,
    border : {
        type: 'bg'
    },
    style  : {
        fg    : '#ffffff',
        bg    : '#000000',
        border: {
            bg: '#313131'
        }
    },
    padding: 1
} );

export const askList = ( prompt: string, options: [ string, string, string | undefined ][] ) => {
    
    listOptions = options;
    
    return new Promise<string>( ( resolve ) => {
        
        list.show();
        report.hide();
        
        mainLabel.setContent( '{center}{bold}' + prompt + '{/bold}{/center}' );
        
        list.clearItems();
        list.setItems( options.map( ( option ) => option[ 0 ] ) );
        
        const hoverSubscription = optionHovered.subscribe( ( option ) => {
            
            let description = '';
            
            if ( option ) {
                const optionArray = options.find( o => o[ 0 ] === option );
                if ( optionArray ) {
                    description = optionArray[ 2 ] || description;
                }
            }
            
            listDescription.setContent( description );
            
            if ( description.length > 0 ) {
                listDescription.show();
            } else {
                listDescription.hide();
            }
            
            screen.render();
        } );
        
        optionSelected.pipe( take( 1 ) ).subscribe( ( option ) => {
            
            selected = 0;
            
            list.hide();
            report.show();
            
            mainLabel.setContent( '{center}{bold}Report{/bold}{/center}' );
            
            report.focus();
            
            screen.render();
            
            hoverSubscription.unsubscribe();
            resolve( options.find( o => o[ 0 ] === option )![ 1 ] );
        } );
        
        list.focus();
        
        optionHovered.next( options[ 0 ][ 0 ] );
        
        screen.render();
    } );
};

export const updateStatistics = () => {
    
    if ( !timer || isNaN( timer.currentMacroTick ) || isNaN( timer.currentMicroTick ) ) {
        
        stats.setContent( '' );
        stats.setLine( 0, '{bold}Conductor:{/bold} ' + 'Not initialized' );
        
    } else {
        
        stats.setLine( 0, '{bold}CPU:{/bold} ' + os.loadavg()[ 0 ].toFixed( 0 ) + '% load' );
        
        const memory     = os.totalmem() / 1024 / 1024 / 1024;
        const memoryFree = os.freemem() / 1024 / 1024 / 1024;
        
        stats.setLine( 1, '{bold}Memory:{/bold} ' + memoryFree.toFixed( 1 ) + 'GB free of ' + memory.toFixed( 1 ) + 'GB' );
        
        const macro_string = ( timer.currentMacroTick < 100 ? '0' : '' ) + ( timer.currentMacroTick < 10 ? '0' : '' ) + timer.currentMacroTick;
        const micro_string = ( timer.currentMicroTick < 10 ? '0' : '' ) + timer.currentMicroTick;
        
        stats.setLine( 2, '{bold}Conductor:{/bold} ' + macro_string + 'M:' + micro_string + 'µ' );
        
        stats.setLine( 3, '{bold}Clock:{/bold} ' + format( new Date(), 'HH\':\'mm\':\'ss\'.\'SSS' ) + ' o\'clock' );
    }
    
    screen.render();
};

export const log = ( text: string ) => {
    report.pushLine( text );
    screen.render();
};

screen.key( [ 'q', 'C-c' ], function( ch, key ) {
    return process.exit( 0 );
} );

screen.append( background );
screen.append( art );
screen.append( logo );
screen.append( mainLabel );
screen.append( list );
screen.append( report );
screen.append( statsLabel );
screen.append( stats );

report.hide();

screen.render();

updateStatistics();
