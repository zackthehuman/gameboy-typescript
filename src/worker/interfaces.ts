import { MemoryAccess } from './memory';
import { ProgramCounter } from './program-counter';

export interface Opcode {
  instruction: number;
  byte: number;
  signedByte: number;
  word: number;
  size: number;
}

export type OpcodeHandler = (op: Opcode) => number;

export interface VirtualMachine {
  cycleCount: number;
  registers: Registers;
  memory: MemoryAccess;
  pc: ProgramCounter;

  didFinishBootROM: boolean;

  ime: boolean;
  imeCycles: number;

  loadROM(data: Uint8Array): void;
  cycle(): void;

  panic(message: string): void;
}

export interface Registers8Bit {
  A: number,
  B: number,
  C: number,
  D: number,
  E: number,
  F: number,
  H: number,
  L: number
}

export interface Registers16Bit {
  AF: number,
  BC: number,
  DE: number,
  HL: number,
  SP: number,
  PC: number
}

export interface Registers extends Registers8Bit, Registers16Bit {
  toJSON(): Object
}

export type ByteRegister = keyof Registers8Bit;
export type WordRegister = keyof Registers16Bit;
