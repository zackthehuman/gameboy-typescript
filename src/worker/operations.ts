import { Opcode, OpcodeHandler, VirtualMachine } from './interfaces';
import { Flags } from './constants';
import { ProgramCounter } from './program-counter';
import { Bit, formatByte, getBit, signedByte, rotateByteLeft } from './bitops';

export interface Operations {
  execOp(op: Opcode): number;
}

export default function createOperations(vm: VirtualMachine): Operations {
  interface OpTable {
    [index: number]: OpcodeHandler,
    length: number
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

  const Op: OpTable = new Array<OpcodeHandler>(0xFF);
  const Cb: OpTable = new Array<OpcodeHandler>(0xFF);

  for (let i: number = 0; i < Op.length; ++i) {
    const opcode: string = formatByte(i);

    Op[i] = function unhandledOpcode() {
      vm.panic(`Unhandled opcode: 0x${opcode}`);
    };

    Cb[i] = function unhandledCBOpcode() {
      vm.panic(`Unhandled CB opcode: 0x${opcode}`);
    };
  }

  // 0x00 - 0x0F

  Op[0x00] = NOP;
  Op[0x01] = LD_BC_d16;
  Op[0x02] = LD_BC_A;
  Op[0x03] = INC_BC;
  Op[0x04] = INC_B;
  Op[0x05] = DEC_B;
  Op[0x06] = LD_B_d8;
  Op[0x07] = RLCA;
  Op[0x08] = LD_a16_SP;
  Op[0x09] = ADD_HL_BC;
  Op[0x0C] = INC_C;
  Op[0x0E] = LD_C_d8;

  Op[0x11] = LD_DE_d16;
  Op[0x1A] = LD_A_DE;

  Op[0x20] = JR_NZ_r8;
  Op[0x21] = LD_HL_d16;

  Op[0x31] = LD_SP_d16;
  Op[0x32] = LD_HL_minus_A;
  Op[0x3E] = LD_A_d8;

  Op[0x4F] = LD_C_A;

  Op[0x77] = LD_HL_A;
  Cb[0x7C] = BIT_7_H;

  Op[0xAF] = XOR_A;

  Op[0xC5] = PUSH_BC;
  Op[0xCB] = CB_PREFIX;
  Op[0xCD] = CALL;

  Op[0xE0] = LDH_d8_A;
  Op[0xE2] = LD_valueAtAddress_C_A;

  function NOP(): number {
    return 4;
  }

  function LD_BC_d16(): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    registers.BC = hi | lo;

    return 12;
  }

  function LD_DE_d16(): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    registers.DE = hi | lo;

    return 12;
  }

  function LD_BC_A(): number {
    const { A, BC } = registers;

    memory.writeByte(0xFF00 + BC, A);

    return 8;
  }

  function LD_A_DE(): number {
    const { DE } = registers;

    registers.A = memory.readByte(DE);

    return 8;
  }

  function INC_BC(): number {
    registers.BC += 1;
    return 8;
  }

  function INC_B(): number {
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
  }

  function INC_C(): number {
    const result: number = (registers.C + 1) & 0xFF;
    const wasCarrySet = isFlagSet(Flags.C);

    registers.C = result;
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
  }

  function DEC_B(): number {
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
  }

  function LD_A_d8(): number {
    const value: number = pc.fetch().toByte();
    pc.increment();
    registers.A = value;

    return 8;
  }

  function LD_B_d8(): number {
    const value: number = pc.fetch().toByte();
    pc.increment();
    registers.B = value;

    return 8;
  }

  function LD_C_d8(): number {
    const value: number = pc.fetch().toByte();
    pc.increment();
    registers.C = value;

    return 8;
  }

  function LD_C_A(): number {
    const { A, C } = registers;

    registers.C = A;

    return 4;
  }

  function RLCA(): number {
    const { A } = registers;

    clearAllFlags();

    if (getBit(A, 7) === 1) {
      setFlag(Flags.C);
    } else {
      clearFlag(Flags.C);
    }

    registers.A = rotateByteLeft(A, 1);

    return 4;
  }

  function LD_a16_SP(): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    const address = (hi | lo) & 0xFFFF;
    registers.SP = address;

    return 20;
  }

  function LDH_d8_A(): number {
    const { A } = registers;
    const offset: number = pc.fetch().toByte();
    pc.increment();

    memory.writeByte(0xFF00 + offset, A);

    return 12;
  }

  function ADD_HL_BC(): number {
    const { HL, BC } = registers;
    const result = HL + BC;
    const wasZeroSet = isFlagSet(Flags.Z);

    clearAllFlags();

    // Restore ZERO flag value if it was set previously.
    if (wasZeroSet) {
      setFlag(Flags.Z);
    }

    // Set if carry from bit 15.
    if (result & 0x10000) {
      setFlag(Flags.C);
    }

    // Set if carry from bit 11.
    if ((HL ^ BC ^ (result & 0xFFFF)) & 0x1000) {
      setFlag(Flags.H);
    }

    registers.HL = result;

    return 8;
  }

  function LD_SP_d16(): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    registers.SP = hi | lo;

    return 12;
  }

  function LD_HL_d16(): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    registers.HL = hi | lo;

    return 12;
  }

  function XOR_A(): number {
    const { A } = registers;
    const result: number = registers.A ^= A;

    registers.A = result;

    clearAllFlags();

    if (result === 0) {
      setFlag(Flags.Z);
    }

    return 4;
  }

  function LD_valueAtAddress_C_A(): number {
    const { A, C } = registers;

    memory.writeByte(0xFF00 + C, A);

    return 8;
  }

  function LD_HL_A(): number {
    const { A, HL } = registers;

    memory.writeByte(HL, A);

    return 8;
  }

  function LD_HL_minus_A(): number {
    const { A, HL } = registers;
    memory.writeByte(HL, A);
    registers.HL--;
    return 8;
  }

  // LD_HL_minus_A.disassembly = 'LD (HL-),A';

  function JR_NZ_r8(): number {
    const offset: number = pc.fetch().toSignedByte();
    pc.increment();

    if (!isFlagSet(Flags.Z)) {
      pc.jump(pc.offset + offset);
      return 12;
    } else {
      return 8;
    }
  }

  function CB_PREFIX(): number {
    const cbOpcode: number = pc.fetch().toByte();
    pc.increment();

    return 4 + Cb[cbOpcode]();
  }

  function CALL(): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    const address: number = hi | lo;
    const nextInstructionAddress: number = pc.offset;

    stackPush(nextInstructionAddress);

    pc.jump(address);

    return 24;
  }

  function PUSH_BC(): number {
    return PUSH(registers.BC);
  }

  function PUSH(address: number): number {
    stackPush(address);
    return 16;
  }

  function stackPush(address: number) {
    registers.SP -= 2; // Address is a word, need to make room for two bytes.
    memory.writeWord(registers.SP, address);
  }

  function BIT_7_H(): number {
    if (getBit(registers.H, 7) == 0) {
        setFlag(Flags.Z);
    } else {
        clearFlag(Flags.Z);
    }

    setFlag(Flags.H);
    clearFlag(Flags.N);

    return 8;
  }

  return {
    execOp(opcode: Opcode): number {
      const cycles = Op[opcode.toByte()]();
      vm.cycleCount += cycles;
      return cycles;
    }
  };
}
