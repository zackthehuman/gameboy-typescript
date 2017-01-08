import { Memory } from './memory';

export class ProgramCounter {
  private offsetAddress: number;
  private rom: Memory;

  constructor(rom: Memory) {
    this.rom = rom;
    this.jump(0);
  }

  get offset(): number {
    return this.offsetAddress;
  }

  increment(): void {
    this.offsetAddress++;
  }

  decrement(): void {
    this.offsetAddress--;
  }

  jump(address: number): void {
    this.offsetAddress = address & 0xFFFF;
  }

  fetch(): number {
    return this.rom.readByte(this.offset);
  }
}
