import { Opcode, OpcodeHandler } from './interfaces';

export interface VirtualMachine {
  cycleCount: number;
}

export interface Operations {
  execOp(op: Opcode): number;
}

export default function createOperations(vm: VirtualMachine): Operations {
  interface OpTable {
    [index: number]: OpcodeHandler
  }

  const Op: OpTable = [];
  const Op0x0: OpTable = [];

  Op[0x0] = function dispatch0x0(op: Opcode) : number {
    return Op0x0[op.hi_nibble](op);
  };

  // 0x00 - 0x0F

  Op0x0[0x0] = function NOP(): number {
    return 4;
  };

  return {
    execOp(opconde: Opcode): number {
      const cycles = Op[opconde.hi](opconde);
      vm.cycleCount += cycles;
      return cycles;
    }
  };
}
