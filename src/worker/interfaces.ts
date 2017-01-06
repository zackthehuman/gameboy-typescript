export interface Opcode {
  readonly hi: number,
  readonly hi_nibble: number
}

export type OpcodeHandler = (op: Opcode) => number;

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
  HL: number
}
