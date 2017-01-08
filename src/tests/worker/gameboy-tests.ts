import createVirtualMachine from '../../worker/vm';
import createOperations from '../../worker/gameboy';
import { Opcode } from '../../worker/interfaces';

function makeVM() {
  return createVirtualMachine();
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

    // The PC will be advanced by 1 and this byte should be read.
    vm.memory.loadBytes([0x23]);
    vm.registers.BC = 0;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x01));

    assert.equal(cycleCount, 12, 'executed cycle count should be 12');
    assert.equal(vm.cycleCount, 12, 'VM\'s cycle count should advance by 12');
    assert.equal(vm.registers.BC, 0x23, 'BC register should be 0x23');
    assert.equal(vm.pc.offset - startOffset, 1, 'The program counter was advanced by 1');
  });

  QUnit.test('LD_BC_A takes 8 cycles, stores value from A into (BC)', function(assert) {
    const vm = makeVM();

    vm.registers.A = 0x3;
    vm.registers.BC = 0x07;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x0200));

    assert.equal(cycleCount, 8, 'executed cycle count should be 8');
    assert.equal(vm.cycleCount, 8, 'VM\'s cycle count should advance by 8');
    assert.equal(vm.memory.readByte(0xFF00 + 0x07), 0x3, 'RAM at correct offset should be 0x3');
  });
}
