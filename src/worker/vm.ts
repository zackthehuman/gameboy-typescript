import { Registers, VirtualMachine } from './interfaces';
import { Memory } from './memory';
import { MMU } from './mmu';
import { ProgramCounter } from './program-counter';

const enum RegisterOrder {
  A, F,
  B, C,
  D, E,
  H, L
}

class RegistersImpl implements Registers {
  private storage: ArrayBuffer;
  private view: DataView;
  private sp: number;
  private pc: number;

  constructor() {
    this.storage = new ArrayBuffer(8);
    this.view = new DataView(this.storage, 0, 8);
    this.clear();
  }

  clear(): void {
    this.A = 0;
    this.B = 0;
    this.C = 0;
    this.D = 0;
    this.E = 0;
    this.F = 0;
    this.H = 0;
    this.L = 0;
    this.sp = 0;
    this.pc = 0;
  }

  get A(): number {
    return this.view.getUint8(RegisterOrder.A);
  }

  set A(value: number) {
    this.view.setUint8(RegisterOrder.A, value);
  }

  get B(): number {
    return this.view.getUint8(RegisterOrder.B);
  }

  set B(value: number) {
    this.view.setUint8(RegisterOrder.B, value);
  }

  get C(): number {
    return this.view.getUint8(RegisterOrder.C);
  }

  set C(value: number) {
    this.view.setUint8(RegisterOrder.C, value);
  }

  get D(): number {
    return this.view.getUint8(RegisterOrder.D);
  }

  set D(value: number) {
    this.view.setUint8(RegisterOrder.D, value);
  }

  get E(): number {
    return this.view.getUint8(RegisterOrder.E);
  }

  set E(value: number) {
    this.view.setUint8(RegisterOrder.E, value);
  }

  get F(): number {
    return this.view.getUint8(RegisterOrder.F);
  }

  set F(value: number) {
    this.view.setUint8(RegisterOrder.F, value);
  }

  get H(): number {
    return this.view.getUint8(RegisterOrder.H);
  }

  set H(value: number) {
    this.view.setUint8(RegisterOrder.H, value);
  }

  get L(): number {
    return this.view.getUint8(RegisterOrder.L);
  }

  set L(value: number) {
    this.view.setUint8(RegisterOrder.L, value);
  }

  get AF(): number {
    return this.view.getUint16(RegisterOrder.A);
  }

  set AF(value: number) {
    this.view.setUint16(RegisterOrder.A, value);
  }

  get BC(): number {
    return this.view.getUint16(RegisterOrder.B);
  }

  set BC(value: number) {
    this.view.setUint16(RegisterOrder.B, value);
  }

  get DE(): number {
    return this.view.getUint16(RegisterOrder.D);
  }

  set DE(value: number) {
    this.view.setUint16(RegisterOrder.D, value);
  }

  get HL(): number {
    return this.view.getUint16(RegisterOrder.H);
  }

  set HL(value: number) {
    this.view.setUint16(RegisterOrder.H, value);
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
  public memory: MMU;
  public pc: ProgramCounter;
  public ime: boolean;
  public imeCycles: number;
  private panicDelegate: (message: string) => void;
  private _didFinishBootROM: boolean;

  constructor(panicDelegate: (message: string) => void) {
    this.cycleCount = 0;
    this.ime = false;
    this.imeCycles = 0;
    this.panicDelegate = panicDelegate;
    this.registers = new RegistersImpl();
    this.memory = new MMU(new Memory());
    this.pc = new ProgramCounter(this.memory, this.registers);
    this.didFinishBootROM = false;
    this.reset();
  }

  private reset() {
    this.cycleCount = 0;
    this.ime = false;
    this.imeCycles = 0;
    this.registers.clear();
    this.memory.clear();
    this.didFinishBootROM = false;
    this.pc.jump(0);
  }

  public get didFinishBootROM(): boolean {
    return this._didFinishBootROM;
  }

  public set didFinishBootROM(value: boolean) {
    this._didFinishBootROM = value;
    this.memory.isBootROMMode = !value;
  }

  loadROM(data: Uint8Array): void {
    this.reset();
    this.memory.loadBytes(data, 0);
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
