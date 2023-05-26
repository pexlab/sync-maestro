// Settings for UART (e.g. if it can receive as well)

//Calculate Baud rate, will be used in L and H registers
.equ f_osc = 16_000_000
.equ r_baud = 9600
.equ ubrr = f_osc / (16 * r_baud)

.equ b_mask = 0x18 // 0001 1000 : enable reciever and transmitter
.equ c_mask = 0x06 // 0000 0110 : 8 bytes per transmission
.equ empty_mask = 0x20 // 0010 0000 : A Register - is set, if transmission is not done
.equ rcv_complete_mask = 0x80 // 1000 0000 :

.equ output = 2;

sbi DDRD, output

//load registers
ldi r17, byte1(ubrr) ; baud rate to H and L 
sts UBRR0L, r17
ldi r17, byte2(ubrr)
sts UBRR0H, r17
ldi r17, b_mask ; b_mask to B register
sts UCSR0B, r17
ldi r17, c_mask ; load c_mask to C register
sts UCSR0C, r17

// Registers:
// r17 = Working register for UART settings
// r18, r19, r20 = Counter for the interval
// r21 = Bytes to be transmitted over UART
// r22 = Working register for transmitting

ldi r21, 0x00 ; init counter to 0

// Main logic (called every second)

counter_interval:

ldi r18 , 0x92
ldi r19 , 0xE0
ldi r20 , 0x22

cbi PORTD, output

call transmit_over_uart //send counter to serial
inc r21 //increment counter. Overflow will be ignored

sbi PORTD, output

// Counter logic (infinite loop to determine when to jump to the main logic)
counter_loop:
	subi r18 , 1
	sbci r19 , 0
	sbci r20 , 0
	nop
	nop
brmi counter_interval 
rjmp counter_loop

// Functions which should only be called from code above
//send a character over uart
transmit_over_uart:
	send_loop: //wait for the connection to be free
		lds r22, UCSR0A
		andi r22, empty_mask 
	breq send_loop
	sts UDR0, r21 //send counter
ret
