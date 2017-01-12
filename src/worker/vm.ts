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
  private sp: number;
  private pc: number;

  get A(): number {
    return this.a;
  }

  set A(value: number) {
    this.a = value;
  }

  get B(): number {
    return this.b;
  }

  set B(value: number) {
    this.b = value & 0xFF;
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

  set F(value: number) {
    this.f = value & 0xFF;
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
    return (this.b << 8) | this.c;
  }

  set BC(value: number) {
    this.b = (value & 0xFF00) >> 8;
    this.c = value & 0x00FF;
  }

  get DE(): number {
    throw new Error('not implemented');
  }

  get HL(): number {
    throw new Error('not implemented');
  }

  get SP(): number {
    return this.sp;
  }

  set SP(value: number) {
    this.sp = value & 0xFFFF;
  }

  get PC(): number {
    return this.pc;
  }

  set PC(value: number) {
    this.pc = value & 0xFFFF;
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
    this.pc = new ProgramCounter(this.memory, this.registers);
  }
}

export default function createVirtualMachine(): VirtualMachine {
  return new VirtualMachineImpl();
}
