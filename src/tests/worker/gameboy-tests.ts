import createVirtualMachine from '../../worker/vm';
import createOperations from '../../worker/gameboy';
import { Opcode, VirtualMachine } from '../../worker/interfaces';
import { Flags } from '../../worker/constants';

function makeVM() {
  return createVirtualMachine();
}

function isFlagSet(vm: VirtualMachine, flag: Flags): boolean {
  return (vm.registers.F & (0x1 << flag)) === (0x1 << flag);
}

class OpcodeImpl {
  constructor(private raw: number) {
    this.raw = raw;
  }

  get hi(): number {
    return (this.raw & 0xF0) >> 8;
  }

  get lo(): number {
    return this.raw & 0xF;
  }

  toByte(): number {
    return this.raw & 0xFF;
  }
}

export default function gameboyTests() {
  module('worker/gameboy - opcodes');

  QUnit.test('NOP takes 4 cycles', function(assert) {
    const vm = makeVM();
    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x00));

    assert.equal(cycleCount, 4, 'executed cycle count should be 4');
    assert.equal(vm.cycleCount, 4, 'VM\'s cycle count should advance by 4');
  });

  QUnit.test('LD_BC_d16 takes 12 cycles, updates BC', function(assert) {
    const vm = makeVM();
    const startOffset = vm.pc.offset;

    // The PC will be advanced by 2 and these bytes should be read.
    vm.memory.loadBytes([0x13, 0x37]);
    vm.registers.BC = 0;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x01));

    assert.equal(cycleCount, 12, 'executed cycle count should be 12');
    assert.equal(vm.cycleCount, 12, 'VM\'s cycle count should advance by 12');
    assert.equal(vm.registers.BC, 0x1337, 'BC register should be 0x1337');
    assert.equal(vm.pc.offset - startOffset, 2, 'the program counter was advanced by 2');
  });

  QUnit.test('LD_BC_A takes 8 cycles, stores value from A into (BC)', function(assert) {
    const vm = makeVM();

    vm.registers.A = 0x3;
    vm.registers.BC = 0x0089;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x02));

    assert.equal(cycleCount, 8, 'executed cycle count should be 8');
    assert.equal(vm.cycleCount, 8, 'VM\'s cycle count should advance by 8');
    assert.equal(vm.memory.readByte(0xFF00 + 0x0089), 0x3, 'RAM at correct offset should be 0x3');
  });

  QUnit.test('INC_BC takes 8 cycles, increments BC by 1', function(assert) {
    const vm = makeVM();

    vm.registers.BC = 0x00;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x03));

    assert.equal(cycleCount, 8, 'executed cycle count should be 8');
    assert.equal(vm.cycleCount, 8, 'VM\'s cycle count should advance by 8');
    assert.equal(vm.registers.BC, 0x1, 'value of BC should be 0x1');
    op.execOp(new OpcodeImpl(0x03));
    assert.equal(vm.registers.BC, 0x2, 'value of BC should now be 0x2');
  });

  QUnit.test('INC_B takes 4 cycles, increments B by 1, sets appropriate flags', function(assert) {
    const vm = makeVM();

    vm.registers.B = 0x00;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x04));

    assert.equal(cycleCount, 4, 'executed cycle count should be 4');
    assert.equal(vm.cycleCount, 4, 'VM\'s cycle count should advance by 4');
    assert.equal(vm.registers.B, 0x1, 'value of B should be 0x1');
    op.execOp(new OpcodeImpl(0x04));
    assert.equal(vm.registers.B, 0x2, 'value of B should now be 0x2');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.N), false, 'subtract flag should be unset');
    assert.equal(isFlagSet(vm, Flags.H), false, 'half-carry flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');

    // Testing overflow 255 -> 0
    vm.registers.F = 0;
    vm.registers.B = 0xFF;
    op.execOp(new OpcodeImpl(0x04));

    assert.equal(isFlagSet(vm, Flags.Z), true, 'zero flag should be set');
    assert.equal(isFlagSet(vm, Flags.N), false, 'subtract flag should be unset');
    assert.equal(isFlagSet(vm, Flags.H), true, 'half-carry flag should be set');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');

    // Testing that CARRY flag is unaffected
    vm.registers.F = 0x1 << Flags.C;
    vm.registers.B = 0x0;
    op.execOp(new OpcodeImpl(0x04));

    assert.equal(isFlagSet(vm, Flags.C), true, 'carry flag should still be set');

    // Testing that HALF_CARRY flag is set correctly.
    vm.registers.F = 0;
    vm.registers.B = 0x0F;
    op.execOp(new OpcodeImpl(0x04));

    assert.equal(isFlagSet(vm, Flags.H), true, 'half-carry flag should be set');
  });

  QUnit.test('DEC_B takes 4 cycles, decrements B by 1, sets appropriate flags', function(assert) {
    const vm = makeVM();

    vm.registers.F = 0;
    vm.registers.B = 0x02;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x05));

    assert.equal(cycleCount, 4, 'executed cycle count should be 4');
    assert.equal(vm.cycleCount, 4, 'VM\'s cycle count should advance by 4');
    assert.equal(vm.registers.B, 0x1, 'value of B should be 0x1');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.N), true, 'subtract flag should be set');
    assert.equal(isFlagSet(vm, Flags.H), false, 'half-carry flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');

    op.execOp(new OpcodeImpl(0x05));
    assert.equal(vm.registers.B, 0x0, 'value of B should now be 0x0');
    assert.equal(isFlagSet(vm, Flags.Z), true, 'zero flag should be set');
    assert.equal(isFlagSet(vm, Flags.N), true, 'subtract flag should be set');
    assert.equal(isFlagSet(vm, Flags.H), false, 'half-carry flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');

    // Testing overflow 0 -> 255
    vm.registers.F = 0;
    vm.registers.B = 0x0;
    op.execOp(new OpcodeImpl(0x05));

    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.N), true, 'subtract flag should be set');
    assert.equal(isFlagSet(vm, Flags.H), true, 'half-carry flag should be set');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');

    // Testing that CARRY flag is unaffected
    vm.registers.F = 0x1 << Flags.C;
    vm.registers.B = 0x0;
    op.execOp(new OpcodeImpl(0x05));

    assert.equal(isFlagSet(vm, Flags.C), true, 'carry flag should still be set');

    // Testing that HALF_CARRY flag is set correctly.
    vm.registers.F = 0;
    vm.registers.B = 0xF0;
    op.execOp(new OpcodeImpl(0x05));

    assert.equal(isFlagSet(vm, Flags.H), true, 'half-carry flag should be set');
  });

  QUnit.test('LD_B_d8 takes 8 cycles, updates B with next byte', function(assert) {
    const vm = makeVM();
    const startOffset = vm.pc.offset;

    // The PC will be advanced by 1 and this byte should be read.
    vm.memory.loadBytes([0x42]);
    vm.registers.B = 0x0;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x06));

    assert.equal(cycleCount, 8, 'executed cycle count should be 8');
    assert.equal(vm.cycleCount, 8, 'VM\'s cycle count should advance by 8');
    assert.equal(vm.registers.B, 0x42, 'B should be 0x42');
    assert.equal(vm.pc.offset - startOffset, 1, 'the program counter was advanced by 1');
  });

  QUnit.test('RCLA takes 4 cycles, rotates the A register left, always clears the Z flag, and keeps bit 7 in the C register', function(assert) {
    const vm = makeVM();
    vm.registers.A = 0x1;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x07));

    assert.equal(cycleCount, 4, 'executed cycle count should be 4');
    assert.equal(vm.cycleCount, 4, 'VM\'s cycle count should advance by 4');
    assert.equal(vm.registers.A, 0x2, 'A should be 0x2');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x4, 'A should be 0x4');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x8, 'A should be 0x8');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x10, 'A should be 0x10');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x20, 'A should be 0x20');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x40, 'A should be 0x40');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x80, 'A should be 0x80');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), false, 'carry flag should be unset');
    op.execOp(new OpcodeImpl(0x07));
    assert.equal(vm.registers.A, 0x1, 'A should be 0x1');
    assert.equal(isFlagSet(vm, Flags.Z), false, 'zero flag should be unset');
    assert.equal(isFlagSet(vm, Flags.C), true, 'carry flag should be set');
  });

  QUnit.test('LD_a16_SP takes 20 cycles, advances the PC by 2, updates SP with next word', function(assert) {
    const vm = makeVM();
    const startOffset = vm.pc.offset;

    // The PC will be advanced by 2 and these bytes should be read.
    vm.memory.loadBytes([0x13, 0x37]);
    vm.registers.SP = 0x0;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x08));

    assert.equal(cycleCount, 20, 'executed cycle count should be 20');
    assert.equal(vm.cycleCount, 20, 'VM\'s cycle count should advance by 20');
    assert.equal(vm.registers.SP, 0x1337, 'SP should be 0x1337');
    assert.equal(vm.pc.offset - startOffset, 2, 'the program counter was advanced by 2');
  });
}
