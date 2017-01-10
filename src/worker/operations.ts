import { Opcode, OpcodeHandler, VirtualMachine } from './interfaces';
import { Flags } from './constants';
import { ProgramCounter } from './program-counter';
import { Bit, getBit, rotateByteLeft } from './bitops';

export interface Operations {
  execOp(op: Opcode): number;
}

export default function createOperations(vm: VirtualMachine): Operations {
  interface OpTable {
    [index: number]: OpcodeHandler
  }

  const { registers, memory, pc } = vm;

  function setFlag(flag: Flags): void {
    registers.F |= (0x1 << flag);
  }

  function clearFlag(flag: Flags): void {
    registers.F &= ~(0x1 << flag);
  }

  function isFlagSet(flag: Flags): boolean {
    return getBit(registers.F, flag) === 1;
  }

  function clearAllFlags(): void {
    registers.F = 0;
  }

  const Op: OpTable = [];
  const Op0x0: OpTable = [];

  Op[0x0] = function dispatch0x0(op: Opcode): number {
    return Op0x0[op.lo](op);
  };

  // 0x00 - 0x0F

  Op0x0[0x0] = function NOP(): number {
    return 4;
  };

  Op0x0[0x1] = function LD_BC_d16(): number {
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();
    const lo: number = pc.fetch().toByte();
    pc.increment();

    registers.BC = hi | lo;

    return 12;
  };

  Op0x0[0x2] = function LD_BC_A(): number {
    const { A, BC } = registers;

    memory.writeByte(0xFF00 + BC, A);

    return 8;
  };

  Op0x0[0x3] = function INC_BC(): number {
    registers.BC += 1;
    return 8;
  };

  Op0x0[0x4] = function INC_B(): number {
    const result: number = (registers.B + 1) & 0xFF;
    const wasCarrySet = isFlagSet(Flags.C);

    registers.B = result;
    clearAllFlags();

    // Restore CARRY flag value if it was set previously.
    if (wasCarrySet) {
      setFlag(Flags.C);
    }

    // Set if result is zero.
    if (0 === result) {
      setFlag(Flags.Z);
    }

    // Set if carry from bit 3.
    if ((result & 0x0F) === 0x00) {
      setFlag(Flags.H);
    }

    return 4;
  };

  Op0x0[0x5] = function DEC_B(): number {
    const result: number = (registers.B - 1) & 0xFF;
    const wasCarrySet = isFlagSet(Flags.C);

    registers.B = result;
    clearAllFlags();
    setFlag(Flags.N);

    // Restore CARRY flag value if it was set previously.
    if (wasCarrySet) {
      setFlag(Flags.C);
    }

    // Set if result is zero.
    if (0 === result) {
      setFlag(Flags.Z);
    }

    // Set if no borrow from bit 4.
    if ((result & 0x0F) === 0x0F) {
      setFlag(Flags.H);
    }

    return 4;
  };

  Op0x0[0x6] = function LD_B_d8(): number {
    const value: number = pc.fetch().toByte();
    pc.increment();
    registers.B = value;

    return 8;
  };

  Op0x0[0x7] = function RLCA(): number {
    const { A } = registers;

    clearAllFlags();

    if (getBit(A, 7) === 1) {
      setFlag(Flags.C);
    } else {
      clearFlag(Flags.C);
    }

    registers.A = rotateByteLeft(A, 1);

    return 4;
  };

  return {
    execOp(opcode: Opcode): number {
      const cycles = Op[opcode.hi](opcode);
      vm.cycleCount += cycles;
      return cycles;
    }
  };
}
