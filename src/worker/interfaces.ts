import { Memory } from './memory';
import { ProgramCounter } from './program-counter';

export interface Opcode {
  readonly hi: number,
  readonly lo: number,
  toByte(): number
}

export type OpcodeHandler = (op: Opcode) => number;

export interface VirtualMachine {
  cycleCount: number;
  registers: Registers;
  memory: Memory;
  pc: ProgramCounter;

  loadROM(data: Uint8Array): void;
  cycle(): void;
}

export interface Registers {
  A: number,
  B: number,
  C: number,
  D: number,
  E: number,
  F: number,
  H: number,
  L: number,
  AF: number,
  BC: number,
  DE: number,
  HL: number,
  SP: number,
  PC: number,
  toJSON(): Object
}
