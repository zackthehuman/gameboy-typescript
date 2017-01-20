import { ByteRegister, Opcode, OpcodeHandler, WordRegister, VirtualMachine } from './interfaces';
import { Flags } from './constants';
import { Bit, formatByte, getBit, rotateByteLeft } from './bitops';

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

    Op[i] = function unhandledOpcode(): number {
      vm.panic(`Unhandled opcode: 0x${opcode}`);
      return 0;
    };

    Cb[i] = function unhandledCBOpcode(): number {
      vm.panic(`Unhandled CB opcode: 0x${opcode}`);
      return 0;
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
  Op[0x13] = INC_DE;
  Op[0x17] = RL_A;
  Op[0x1A] = LD_A_DE;

  Op[0x20] = JR_NZ_r8;
  Op[0x21] = LD_HL_d16;
  Op[0x22] = LDI_HL_A;
  Op[0x23] = INC_HL;

  Op[0x31] = LD_SP_d16;
  Op[0x32] = LDD_HL_A;
  Op[0x33] = INC_SP;
  Op[0x3E] = LD_A_d8;

  Op[0x4F] = LD_C_A;

  Op[0x77] = LD_HL_A;

  Op[0xAF] = XOR_A;

  Op[0xC1] = POP_BC;
  Op[0xC5] = PUSH_BC;
  Op[0xC9] = RET;
  Op[0xCB] = CB_PREFIX;
  Op[0xCD] = CALL;

  Op[0xE0] = LDH_d8_A;
  Op[0xE2] = LD_valueAtAddress_C_A;

  // CB Table
  Cb[0x10] = CB_RL_B;
  Cb[0x11] = CB_RL_C;
  Cb[0x12] = CB_RL_D;
  Cb[0x13] = CB_RL_E;
  Cb[0x14] = CB_RL_H;
  Cb[0x15] = CB_RL_L;

  Cb[0x17] = CB_RL_A;

  Cb[0x7C] = CB_BIT_7_H;


  function NOP(): number {
    pc.increment();
    return 4;
  }

  function LD_BC_d16(): number {
    pc.increment();
    return LD_d16('BC');
  }

  function LD_DE_d16(): number {
    pc.increment();
    return LD_d16('DE');
  }

  function LD_d16(name: WordRegister): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    registers[name] = hi | lo;

    return 12;
  }

  function LD_BC_A(): number {
    pc.increment();
    const { A, BC } = registers;

    memory.writeByte(0xFF00 + BC, A);

    return 8;
  }

  function LD_A_DE(): number {
    pc.increment();
    const { DE } = registers;

    registers.A = memory.readByte(DE);

    return 8;
  }

  function INC_BC(): number {
    pc.increment();
    return INC_WORD('BC');
  }

  function INC_DE(): number {
    pc.increment();
    return INC_WORD('DE');
  }

  function INC_HL(): number {
    pc.increment();
    return INC_WORD('HL');
  }

  function INC_SP(): number {
    pc.increment();
    return INC_WORD('SP');
  }

  function INC_WORD(name: WordRegister): number {
    registers[name] += 1;
    return 8;
  }

  function INC_B(): number {
    pc.increment();
    return INC_BYTE('B');
  }

  function INC_C(): number {
    pc.increment();
    return INC_BYTE('C');
  }

  function INC_BYTE(name: ByteRegister): number {
    const result: number = (registers[name] + 1) & 0xFF;
    const wasCarrySet = isFlagSet(Flags.C);

    registers[name] = result;
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
    pc.increment();
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
    pc.increment();
    return LD_register_d8('A');
  }

  function LD_B_d8(): number {
    pc.increment();
    return LD_register_d8('B');
  }

  function LD_C_d8(): number {
    pc.increment();
    return LD_register_d8('C');
  }

  function LD_register_d8(name: ByteRegister): number {
    const value: number = pc.fetch().toByte();
    pc.increment();
    registers[name] = value;

    return 8;
  }

  function LD_C_A(): number {
    pc.increment();
    const { A } = registers;

    registers.C = A;

    return 4;
  }

  function RL_A(): number {
    pc.increment();
    RL('A');
    return 4;
  }

  function RLCA(): number {
    pc.increment();
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
    pc.increment();
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    const address = (hi | lo) & 0xFFFF;
    registers.SP = address;

    return 20;
  }

  function LDH_d8_A(): number {
    pc.increment();
    const { A } = registers;
    const offset: number = pc.fetch().toByte();
    pc.increment();

    memory.writeByte(0xFF00 + offset, A);

    return 12;
  }

  function ADD_HL_BC(): number {
    pc.increment();
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
    pc.increment();
    return LD_register_d16('SP');
  }

  function LD_HL_d16(): number {
    pc.increment();
    return LD_register_d16('HL');
  }

  function LD_register_d16(name: WordRegister): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    registers[name] = hi | lo;

    return 12;
  }

  function XOR_A(): number {
    pc.increment();
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
    pc.increment();
    const { A, C } = registers;

    memory.writeByte(0xFF00 + C, A);

    return 8;
  }

  function LD_HL_A(): number {
    pc.increment();
    const { A, HL } = registers;

    memory.writeByte(HL, A);

    return 8;
  }

  function LDI_HL_A(): number {
    pc.increment();
    const { A, HL } = registers;
    memory.writeByte(HL, A);
    registers.HL++;
    return 8;
  }

  function LDD_HL_A(): number {
    pc.increment();
    const { A, HL } = registers;
    memory.writeByte(HL, A);
    registers.HL--;
    return 8;
  }

  // LDD_HL_A.disassembly = 'LD (HL-),A';

  function JR_NZ_r8(): number {
    pc.increment();
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
    pc.increment();
    const cbOpcode: number = pc.fetch().toByte();
    return 4 + Cb[cbOpcode]();
  }

  function CALL(): number {
    pc.increment();
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

  function RET(): number {
    pc.increment();
    pc.jump(stackPop());
    return 8;
  }

  function PUSH_BC(): number {
    pc.increment();
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

  function stackPop(): number {
    const address: number = memory.readWord(registers.SP);
    registers.SP += 2;
    return address;
  }

  function POP_BC(): number {
    pc.increment();
    registers.BC = memory.readWord(registers.SP);
    registers.SP += 2;

    return 12;
  }

  function CB_RL_A(): number {
    pc.increment();
    return RL('A');
  }

  function CB_RL_B(): number {
    pc.increment();
    return RL('B');
  }

  function CB_RL_C(): number {
    pc.increment();
    return RL('C');
  }

  function CB_RL_D(): number {
    pc.increment();
    return RL('D');
  }

  function CB_RL_E(): number {
    pc.increment();
    return RL('E');
  }

  function CB_RL_H(): number {
    pc.increment();
    return RL('H');
  }

  function CB_RL_L(): number {
    pc.increment();
    return RL('L');
  }

  function RL(name: ByteRegister): number {
    const carry: Bit = isFlagSet(Flags.C) ? 1 : 0;
    let result = registers[name];

    clearAllFlags();

    if ((result & 0x80) !== 0) {
      setFlag(Flags.C);
    }

    result <<= 1;
    result |= carry;

    registers[name] = result;

    if (registers[name] === 0) {
      setFlag(Flags.Z);
    }

    return 8;
  }

  function CB_BIT_7_H(): number {
    pc.increment();
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
