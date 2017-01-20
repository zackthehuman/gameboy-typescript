import { Registers, VirtualMachine } from './interfaces';
import { BOOT_ROM_DATA, BOOT_ROM_OFFSET, CARTRIDGE_ROM_OFFSET } from './constants';
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

  constructor() {
    this.clear();
  }

  clear(): void {
    this.a = 0;
    this.b = 0;
    this.c = 0;
    this.d = 0;
    this.e = 0;
    this.f = 0;
    this.h = 0;
    this.l = 0;
    this.sp = 0;
    this.pc = 0;
  }

  get A(): number {
    return this.a;
  }

  set A(value: number) {
    this.a = value & 0xFF;
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

  set C(value: number) {
    this.c = value & 0xFF;
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
    return (this.d << 8) | this.e;
  }

  set DE(value: number) {
    this.d = (value & 0xFF00) >> 8;
    this.e = value & 0x00FF;
  }

  get HL(): number {
    return (this.h << 8) | this.l;
  }

  set HL(value: number) {
    this.h = (value & 0xFF00) >> 8;
    this.l = value & 0x00FF;
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

  toJSON(): Object {
    const {
      A, B, C, D, E, F, H, L, SP, PC
    } = this;

    return {
      A, B, C, D, E, F, H, L, SP, PC
    };
  }
}

class VirtualMachineImpl implements VirtualMachine {
  public cycleCount: number;
  public registers: RegistersImpl;
  public memory: Memory;
  public pc: ProgramCounter;
  private panicDelegate: (message: string) => void;

  constructor(panicDelegate: (message: string) => void) {
    this.cycleCount = 0;
    this.panicDelegate = panicDelegate;
    this.registers = new RegistersImpl();
    this.memory = new Memory();
    this.pc = new ProgramCounter(this.memory, this.registers);
    this.reset();
  }

  private reset() {
    this.cycleCount = 0;
    this.registers.clear();
    this.memory.clear();
    this.loadBootROM();
    this.pc.jump(0);
  }

  private loadBootROM(): void {
    this.memory.loadBytes(BOOT_ROM_DATA, BOOT_ROM_OFFSET);
  }

  loadROM(data: Uint8Array): void {
    this.reset();
    this.memory.loadBytes(data, CARTRIDGE_ROM_OFFSET);
  }

  cycle(): void {

  }

  panic(message: string): void {
    if (typeof this.panicDelegate === 'function') {
      return this.panicDelegate(message);
    } else {
      throw new Error(message);
    }
  }
}

export default function createVirtualMachine(panicDelegate: (message: string) => void): VirtualMachine {
  return new VirtualMachineImpl(panicDelegate);
}
