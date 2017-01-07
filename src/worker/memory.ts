export class Memory {
  private RAM: Uint8Array;

  constructor() {
    this.RAM = new Uint8Array(0xFFFF);
  }

  loadBytes(bytes: Uint8Array) {
    this.RAM.set(bytes, 0);
  }

  readByte(address: number): number {
    return this.RAM[address] & 0xFF;
  }

  readWord(address: number): number {
    return (this.RAM[address] << 8 | this.RAM[address + 1]) & 0xFFFF;
  }

  writeByte(address: number, value: number): void {
    this.RAM[address] = value & 0xFF;
  }

  writeWord(address: number, value: number): void {
    this.RAM[address] = (value & 0xFF00) >> 8;
    this.RAM[address + 1] = value & 0xFF;
  }
}
