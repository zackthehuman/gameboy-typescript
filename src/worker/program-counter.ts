import { MemoryAccess } from './memory';
import { Opcode, Registers } from './interfaces';
import { OpcodeView } from './opcode';

export class ProgramCounter {
  private memory: MemoryAccess;
  private registers: Registers;
  private op: OpcodeView;

  constructor(memory: MemoryAccess, registers: Registers) {
    this.memory = memory;
    this.registers = registers;
    this.jump(0);
    this.op = new OpcodeView(this.memory, 0);
  }

  get offset(): number {
    return this.registers.PC;
  }

  increment(offset: number = 1): void {
    this.registers.PC += offset;
  }

  decrement(offset: number = 1): void {
    this.registers.PC -= offset;
  }

  jump(address: number): void {
    this.registers.PC = address & 0xFFFF;
  }

  fetch(): Opcode {
    this.op.offset = this.offset;
    return this.op;
  }
}
