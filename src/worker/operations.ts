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
  Op[0x0A] = LD_A_BC;
  Op[0x0C] = INC_C;
  Op[0x0D] = DEC_C;
  Op[0x0E] = LD_C_d8;

  Op[0x11] = LD_DE_d16;
  Op[0x13] = INC_DE;
  Op[0x15] = DEC_D;
  Op[0x16] = LD_D_d8;
  Op[0x17] = RL_A;
  Op[0x18] = JR_r8;
  Op[0x1A] = LD_A_DE;
  Op[0x1D] = DEC_E;
  Op[0x1E] = LD_E_d8;

  Op[0x20] = JR_NZ_r8;
  Op[0x21] = LD_HL_d16;
  Op[0x22] = LDI_HL_A;
  Op[0x23] = INC_HL;
  Op[0x25] = DEC_H;
  Op[0x26] = LD_H_d8;
  Op[0x28] = JR_Z_r8;
  Op[0x2D] = DEC_L;
  Op[0x2E] = LD_L_d8;

  Op[0x30] = JR_NC_r8;
  Op[0x31] = LD_SP_d16;
  Op[0x32] = LDD_HL_A;
  Op[0x33] = INC_SP;
  Op[0x38] = JR_C_r8;
  Op[0x3D] = DEC_A;
  Op[0x3E] = LD_A_d8;

  Op[0x47] = LD_B_A;
  Op[0x4F] = LD_C_A;

  Op[0x57] = LD_D_A;
  Op[0x5F] = LD_E_A;

  Op[0x67] = LD_H_A;
  Op[0x6F] = LD_L_A;

  Op[0x77] = LD_HL_A;
  Op[0x7B] = LD_A_E;
  Op[0x7E] = LD_A_HL;
  Op[0x7F] = LD_A_A;

  Op[0x87] = ADD_A_A;
  Op[0x80] = ADD_A_B;
  Op[0x81] = ADD_A_C;
  Op[0x82] = ADD_A_D;
  Op[0x83] = ADD_A_E;
  Op[0x84] = ADD_A_H;
  Op[0x85] = ADD_A_L;

  Op[0xAF] = XOR_A;

  Op[0xC1] = POP_BC;
  Op[0xC5] = PUSH_BC;
  Op[0xC9] = RET;
  Op[0xCB] = CB_PREFIX;
  Op[0xCD] = CALL;

  Op[0xD5] = PUSH_DE;

  Op[0xE0] = LDH_d8_A;
  Op[0xE2] = LD_valueAtAddress_C_A;
  Op[0xEA] = LD_nn_A;
  Op[0xE5] = PUSH_HL;

  Op[0xF0] = LDH_A_d8;
  Op[0xF3] = DI;
  Op[0xF5] = PUSH_AF;
  Op[0xFA] = LD_A_nn;
  Op[0xFB] = EI;
  Op[0xFE] = CP_d8;

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

  function LD_A_E(): number {
    pc.increment();
    return LD_8bit_8bit('A', 'E');
  }

  function LD_8bit_8bit(dest: ByteRegister, source: ByteRegister): number {
    registers[dest] = registers[source];
    return 4;
  }

  function LD_A_BC(): number {
    pc.increment();
    return LD_8bit_16bit('A', 'BC');
  }

  function LD_A_DE(): number {
    pc.increment();
    return LD_8bit_16bit('A', 'DE');
  }

  function LD_A_HL(): number {
    pc.increment();
    return LD_8bit_16bit('A', 'HL');
  }

  function LD_A_nn(): number {
    pc.increment();
    return LD_8bit_address('A');
  }

  function LD_8bit_16bit(dest: ByteRegister, source: WordRegister): number {
    registers[dest] = memory.readByte(registers[source]);
    return 8;
  }

  function LD_8bit_address(name: ByteRegister): number {
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();
    const address = (hi | lo) & 0xFFFF;

    registers[name] = memory.readByte(address);

    return 16;
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

  function DEC_A(): number {
    pc.increment();
    return DEC('A');
  }

  function DEC_B(): number {
    pc.increment();
    return DEC('B');
  }

  function DEC_C(): number {
    pc.increment();
    return DEC('C');
  }

  function DEC_D(): number {
    pc.increment();
    return DEC('D');
  }

  function DEC_E(): number {
    pc.increment();
    return DEC('E');
  }

  function DEC_H(): number {
    pc.increment();
    return DEC('H');
  }

  function DEC_L(): number {
    pc.increment();
    return DEC('L');
  }

  function DEC(name: ByteRegister): number {
    const result: number = (registers[name] - 1) & 0xFF;
    const wasCarrySet = isFlagSet(Flags.C);

    registers[name] = result;
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

  function ADD_A_A(): number {
    pc.increment();
    return ADD_register_register('A', 'A');
  }

  function ADD_A_B(): number {
    pc.increment();
    return ADD_register_register('A', 'B');
  }

  function ADD_A_C(): number {
    pc.increment();
    return ADD_register_register('A', 'C');
  }

  function ADD_A_D(): number {
    pc.increment();
    return ADD_register_register('A', 'D');
  }

  function ADD_A_E(): number {
    pc.increment();
    return ADD_register_register('A', 'E');
  }

  function ADD_A_H(): number {
    pc.increment();
    return ADD_register_register('A', 'H');
  }

  function ADD_A_L(): number {
    pc.increment();
    return ADD_register_register('A', 'L');
  }

  function ADD_register_register(dest: ByteRegister, source: ByteRegister): number {
    const augend: number = registers[dest];
    const addend: number = registers[source];
    const sum: number = (augend + addend) & 0xFF;
    const carryBits: number = augend ^ addend ^ sum;

    registers[dest] = sum;

    clearAllFlags();

    if (sum === 0) {
      setFlag(Flags.Z);
    }

    if ((carryBits & 0x100) !== 0) {
      setFlag(Flags.C);
    }

    if ((carryBits & 0x10) !== 0) {
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

  function LD_D_d8(): number {
    pc.increment();
    return LD_register_d8('D');
  }

  function LD_E_d8(): number {
    pc.increment();
    return LD_register_d8('E');
  }

  function LD_L_d8(): number {
    pc.increment();
    return LD_register_d8('L');
  }

  function LD_H_d8(): number {
    pc.increment();
    return LD_register_d8('H');
  }

  function LD_register_d8(name: ByteRegister): number {
    const value: number = pc.fetch().toByte();
    pc.increment();
    registers[name] = value;

    return 8;
  }

  function LD_A_A(): number {
    pc.increment();
    return LD_register_register('A', 'A');
  }

  function LD_B_A(): number {
    pc.increment();
    return LD_register_register('B', 'A');
  }

  function LD_C_A(): number {
    pc.increment();
    return LD_register_register('C', 'A');
  }

  function LD_D_A(): number {
    pc.increment();
    return LD_register_register('D', 'A');
  }

  function LD_E_A(): number {
    pc.increment();
    return LD_register_register('E', 'A');
  }

  function LD_H_A(): number {
    pc.increment();
    return LD_register_register('H', 'A');
  }

  function LD_L_A(): number {
    pc.increment();
    return LD_register_register('L', 'A');
  }

  function LD_register_register(dest: ByteRegister, source: ByteRegister): number {
    registers[dest] = registers[source];
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

  function LD_nn_A(): number {
    pc.increment();
    const lo: number = pc.fetch().toByte();
    pc.increment();
    const hi: number = pc.fetch().toByte() << 8;
    pc.increment();

    const address = (hi | lo) & 0xFFFF;
    const { A } = registers;

    memory.writeByte(address, A);

    return 16;
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

  function LDH_A_d8(): number {
    pc.increment();
    const offset: number = pc.fetch().toByte();
    pc.increment();

    registers.A = memory.readByte(0xFF00 + offset);

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

  function JR_r8(): number {
    pc.increment();
    const offset: number = pc.fetch().toSignedByte();
    pc.increment();

    pc.jump(pc.offset + offset);

    return 12;
  }

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

  function JR_Z_r8(): number {
    pc.increment();
    const offset: number = pc.fetch().toSignedByte();
    pc.increment();

    if (isFlagSet(Flags.Z)) {
      pc.jump(pc.offset + offset);
      return 12;
    } else {
      return 8;
    }
  }

  function JR_NC_r8(): number {
    pc.increment();
    const offset: number = pc.fetch().toSignedByte();
    pc.increment();

    if (!isFlagSet(Flags.C)) {
      pc.jump(pc.offset + offset);
      return 12;
    } else {
      return 8;
    }
  }

  function JR_C_r8(): number {
    pc.increment();
    const offset: number = pc.fetch().toSignedByte();
    pc.increment();

    if (isFlagSet(Flags.C)) {
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

  function PUSH_AF(): number {
    pc.increment();
    return PUSH(registers.AF);
  }

  function PUSH_BC(): number {
    pc.increment();
    return PUSH(registers.BC);
  }

  function PUSH_DE(): number {
    pc.increment();
    return PUSH(registers.DE);
  }

  function PUSH_HL(): number {
    pc.increment();
    return PUSH(registers.HL);
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

  function CP_d8(): number {
    pc.increment();
    const value: number = pc.fetch().toByte();
    pc.increment();

    CP_IMPL(value);

    return 8;
  }

  function CP_IMPL(value: number): void {
    const { A } = registers;
    const result: number = A - value;

    setFlag(Flags.N);

    if (result === 0) {
      setFlag(Flags.Z);
    }

    if ((result & 0x80) !== 0) {
      setFlag(Flags.C);
    }

    if ((result & 0x0F) === 0x0F) {
      setFlag(Flags.H);
    }
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

  function DI(): number {
    pc.increment();
    // This instruction disables interrupts but not
    // immediately. Interrupts are disabled after
    // instruction after DI is executed.
    vm.ime = false;
    vm.imeCycles = 0;

    console.warn('The DI opcode is not actually implemented yet.');

    return 4;
  }

  function EI(): number {
    pc.increment();
    // Enable interrupts. This intruction enables interrupts
    // but not immediately. Interrupts are enabled after
    // instruction after EI is executed.
    vm.imeCycles = 4 + 1;

    console.warn('The EI opcode is not actually implemented yet.');

    return 4;
  }

  return {
    execOp(opcode: Opcode): number {
      const cycles = Op[opcode.toByte()]();
      vm.cycleCount += cycles;
      return cycles;
    }
  };
}
