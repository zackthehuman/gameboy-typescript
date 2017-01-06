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
    return (this.raw & 0xF000) >> 12;
  }

  get hi_nibble(): number {
    return (this.raw & 0x0F00) >> 8;
  }

  get nn(): number {
    return (this.raw & 0x00FF);
  }
}

export default function gameboyTests() {
  module('worker/gameboy - opcodes');

  QUnit.test('NOP takes 4 cycles', function(assert) {
    const vm = makeVM();
    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x0));

    assert.equal(cycleCount, 4, 'executed cycle count should be 4');
    assert.equal(vm.cycleCount, 4, 'VM\'s cycle count should advance by 4');
  });

  QUnit.test('LD_BC_d16 takes 12 cycles, updates BC', function(assert) {
    const vm = makeVM();

    vm.registers.BC = 0;

    const op = createOperations(vm);
    const cycleCount = op.execOp(new OpcodeImpl(0x0123));

    assert.equal(cycleCount, 12, 'executed cycle count should be 12');
    assert.equal(vm.cycleCount, 12, 'VM\'s cycle count should advance by 12');
    assert.equal(vm.registers.BC, 0x23, 'BC register should be 0x23');
  });
}
