export function rotateByteLeft(value: number, moves: number): number {
  return ((value << moves) | (value >>> (8 - moves))) & 0xFF;
}

export type Bit = 0 | 1;

export function getBit(value: number, bit: number): Bit {
  return ((value >>> bit) & 0x1) as Bit;
}
