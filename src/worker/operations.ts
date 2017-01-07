import { Opcode, OpcodeHandler, VirtualMachine } from './interfaces';

export interface Operations {
  execOp(op: Opcode): number;
}

export default function createOperations(vm: VirtualMachine): Operations {
  interface OpTable {
    [index: number]: OpcodeHandler
  }

  const { registers, RAM } = vm;
  const Op: OpTable = [];
  const Op0x0: OpTable = [];

  Op[0x0] = function dispatch0x0(op: Opcode) : number {
    return Op0x0[op.hi_nibble](op);
  };

  // 0x00 - 0x0F

  Op0x0[0x0] = function NOP(): number {
    return 4;
  };

  Op0x0[0x1] = function LD_BC_d16(op: Opcode): number {
    const { nn } = op;

    registers.BC = nn;

    return 12;
  };

  Op0x0[0x2] = function LD_BC_A(op: Opcode): number {
    const { A, BC } = registers;

    RAM[0xFF00 + BC] = A;

    return 8;
  };

  return {
    execOp(opcode: Opcode): number {
      const cycles = Op[opcode.hi](opcode);
      vm.cycleCount += cycles;
      return cycles;
    }
  };
}
