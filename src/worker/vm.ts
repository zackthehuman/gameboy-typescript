import { Registers, VirtualMachine } from './interfaces';
import { Memory } from './memory';
import { ProgramCounter } from './program-counter';

class RegistersImpl implements Registers {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  private e: number;
  private f: number;
  private h: number;
  private l: number;

  get A(): number {
    return this.a;
  }

  set A(value: number) {
    this.a = value;
  }

  get B(): number {
    return this.b;
  }

  get C(): number {
    return this.c;
  }

  get D(): number {
    return this.d;
  }

  get E(): number {
    return this.e;
  }

  get F(): number {
    return this.f;
  }

  get H(): number {
    return this.h;
  }

  get L(): number {
    return this.l;
  }

  get AF(): number {
    throw new Error('not implemented');
  }

  get BC(): number {
    return (this.b << 4) | this.c;
  }

  set BC(value: number) {
    this.b = (value & 0xF0) >> 4;
    this.c = value & 0x0F;
  }

  get DE(): number {
    throw new Error('not implemented');
  }

  get HL(): number {
    throw new Error('not implemented');
  }
}

class VirtualMachineImpl implements VirtualMachine {
  public cycleCount: number;
  public registers: Registers;
  public memory: Memory;
  public pc: ProgramCounter;

  constructor() {
    this.cycleCount = 0;
    this.registers = new RegistersImpl();
    this.memory = new Memory();
    this.memory.clear();
    this.pc = new ProgramCounter(this.memory);
  }
}

export default function createVirtualMachine(): VirtualMachine {
  return new VirtualMachineImpl();
}
