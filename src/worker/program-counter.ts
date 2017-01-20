import { Memory } from './memory';
import { Opcode, Registers } from './interfaces';
import { OpcodeImpl } from './opcode';

export class ProgramCounter {
  private ram: Memory;
  private registers: Registers;
  private op: OpcodeImpl;

  constructor(ram: Memory, registers: Registers) {
    this.ram = ram;
    this.registers = registers;
    this.jump(0);
    this.op = new OpcodeImpl(0);
  }

  get offset(): number {
    return this.registers.PC;
  }

  increment(): void {
    this.registers.PC++;
  }

  decrement(): void {
    this.registers.PC--;
  }

  jump(address: number): void {
    this.registers.PC = address & 0xFFFF;
  }

  fetch(): Opcode {
    this.op.raw = this.ram.readByte(this.offset);
    return this.op;
  }
}
