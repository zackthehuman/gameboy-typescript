export function rotateByteLeft(value: number, moves: number): number {
  return ((value << moves) | (value >>> (8 - moves))) & 0xFF;
}

export type Bit = 0 | 1;

export function getBit(value: number, bit: number): Bit {
  return ((value >>> bit) & 0x1) as Bit;
}

export function formatByte(value: number): string {
  const hex: string = value.toString(16);
  return ('00' + hex).substring(hex.length);
}

export function signedByte(value: number): number {
  if (value > 127) {
    value = -((~value + 1 ) & 255);
  }

  return value;
}
