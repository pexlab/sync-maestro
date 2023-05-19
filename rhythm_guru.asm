.equ output_bit = 3

.equ f_osc = 16_000_000
.equ r_baud = 9600
.equ ubrr = f_osc / (16 * r_baud)

.equ b_mask = 0x18 //0x18 // 0001 1000
.equ c_mask = 0x06 // 0000 0110
.equ empty_mask = 0x20 //0010 0000
.equ rcv_complete_mask = 0x80 //1000 0000

sbi DDRD , output_bit

ldi r17, byte1(ubrr)
sts UBRR0L, r17
ldi r17, byte2(ubrr)
sts UBRR0H, r17

ldi r17, b_mask
sts UCSR0B, r17


toggle:

LDI r16 , 0x80
LDI r17 , 0x84
LDI r18 , 0x1E

ldi ZH, high(hello<<1)
	ldi ZL, low(hello<<1)
	char_send_loop:
		lpm r19, Z+
		tst r19
		breq continue
		call send_character
	rjmp char_send_loop

continue:

counter_loop:

; 5 Cycles
subi r16 , 1
sbci r17 , 0
sbci r18 , 0
nop
nop

BRMI toggle ; 1-2 Cycles 
; Muss eigt noch geprüft werden ob r16 und r17 null sind
rjmp counter_loop ; 2 Cycles

send_character:
	//pop r18 ; load char to r18
	send_loop: ; wait until register empty
		lds r20, UCSR0A ; load A Status register to r17
		andi r20, empty_mask 
	breq send_loop
	sts UDR0, r19
ret

hello_avr:
	.db "hello avr",0

hello:
	.db "Hello World!",10,13, 0
