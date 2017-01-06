import createOperations from '../../worker/gameboy';
import { Opcode } from '../../worker/interfaces';

function makeVM() {
  return {
    cycleCount: 0
  };
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
}
