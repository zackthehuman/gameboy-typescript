import { Memory } from './memory';
import { Opcode } from './interfaces';

class OpcodeImpl {
  constructor(public raw: number) {
  }

  get hi(): number {
    return (this.raw & 0xF0) >> 4;
  }

  get lo(): number {
    return this.raw & 0x0F;
  }

  toByte(): number {
    return this.raw & 0xFF;
  }
}

export class ProgramCounter {
  private offsetAddress: number;
  private rom: Memory;
  private op: OpcodeImpl;

  constructor(rom: Memory) {
    this.rom = rom;
    this.jump(0);
    this.op = new OpcodeImpl(0);
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

  fetch(): Opcode {
    this.op.raw = this.rom.readByte(this.offset);
    return this.op;
  }
}
