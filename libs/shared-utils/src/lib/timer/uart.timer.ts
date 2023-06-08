// import { SerialPort } from 'serialport';
//
// const ttl = new SerialPort( {
//     path    : '/dev/tty.usbserial-FTAQEW6P',
//     baudRate: 9600
// } );
//
// ttl.on( 'data', function( data ) {
//
//     console.log( data[ 0 ] );
//
//     if ( data[ 0 ] % 30 === 1 ) {
//         mpv.resume().then();
//     }
// } );