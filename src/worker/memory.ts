export interface MemoryAccess {
  readByte(address: number): number
  readWord(address: number): number
  writeByte(address: number, value: number): void
  writeWord(address: number, value: number): void
}

export class Memory {
  constructor() {
  }

  clear(region: Uint8Array): void {
    region.fill(0);
  }

  readByte(region: Uint8Array, address: number): number {
    return region[address] & 0xFF;
  }

  readWord(region: Uint8Array, address: number): number {
    return (region[address] << 8 | region[address + 1]) & 0xFFFF;
  }

  writeByte(region: Uint8Array, address: number, value: number): void {
    region[address] = value & 0xFF;
  }

  writeWord(region: Uint8Array, address: number, value: number): void {
    this.writeByte(region, address, (value & 0xFF00) >> 8);
    this.writeByte(region, address + 1, value & 0xFF);
  }
}
