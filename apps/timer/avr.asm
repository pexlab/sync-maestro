; Settings for UART (e.g. if it can receive as well)

; Calculate Baud rate, will be used in L and H registers
.equ f_osc = 16_000_000
.equ r_baud = 9600
.equ ubrr = f_osc / (16 * r_baud)

.equ b_mask = 0x18 // 0001 1000 : enable reciever and transmitter
.equ c_mask = 0x06 // 0000 0110 : 8 bits per transmission
.equ empty_mask = 0x20 // 0010 0000 : A Register - is set, if transmission is not done
.equ rcv_complete_mask = 0x80 // 1000 0000

; Load registers
ldi r17, byte1(ubrr) ; baud rate to H and L 
sts UBRR0L, r17
ldi r17, byte2(ubrr)
sts UBRR0H, r17
ldi r17, b_mask ; b_mask to B register
sts UCSR0B, r17
ldi r17, c_mask ; load c_mask to C register
sts UCSR0C, r17

; Registers:
; r17 = Working register for UART settings
; r18, r19, r20 = Counter for the interval
; r21 = Bytes to be transmitted over UART
; r22 = Working register for transmitting

ldi r25, 0x01 ; init macro counter to 1
ldi r26, 0x01 ; init micro counter to 1

; Settings for debug pin
.equ output = 2;
sbi DDRD, output

; Main logic (called every second)
counter_interval:


	ldi r19 , 0x20
	ldi r20 , 0x4E

	brts debug_pin_off ; If "set" flag, jump to toggle it off
	sbi PORTD , output ; Toggle debug pin on
	set
	rjmp continue_interval
		debug_pin_off:
		cbi PORTD , output ; Toggle debug pin off
		clt
	continue_interval:
	call transmit_over_uart ; Send counter to Serial

	inc r26
	cpi r26, 0x65
	brne skip_micro_reset
		ldi r26, 0x01
		inc r25
	skip_micro_reset:


	cpi r25, 0xFF
	brne skip_macro_reset
		ldi r25, 0x01
	skip_macro_reset:


; Counter logic (infinite loop to determine when to jump to the main logic)
	counter_loop:
		subi r19 , 1
		sbci r20 , 0
		nop
		nop
		nop
brmi counter_interval
	rjmp counter_loop

; Functions which should only be called from code above

; Send a character over UART
transmit_over_uart:
	cpi r26, 0x01
	brne send_micro_l
		ldi r24, 0x00
		call transmit_byte
		mov r24, r25
		call transmit_byte
		ret
	send_micro_l:
		ldi r24, 0xFF
		call transmit_byte
		mov r24, r26
		call transmit_byte
		ret

transmit_byte: //transmits r24 to UARTA
	send_occupied:
		lds r22, UCSR0A
		andi r22, empty_mask
	breq send_occupied
	sts UDR0, r24
ret