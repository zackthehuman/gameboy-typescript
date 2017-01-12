import { ProgramCounter } from '../../worker/program-counter';
import { Memory } from '../../worker/memory';
import { Registers } from '../../worker/interfaces';

class FakeRegisters implements Registers {
  constructor() {
    this.PC = 0;
  }

  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  H: number;
  L: number;
  AF: number;
  BC: number;
  DE: number;
  HL: number;
  SP: number;
  PC: number;
}

export default function programCounterTests() {
  let mem: Memory;
  let sample: Uint8Array;
  let pc: ProgramCounter;

  module('worker/program-counter', {
    beforeEach() {
      mem = new Memory();
      mem.loadBytes([0x01, 0x03, 0x03, 0x07, 0x13, 0x37]);
      pc = new ProgramCounter(mem, new FakeRegisters());
    }
  });

  QUnit.test('increment() increases the offset by 1', function(assert) {
    assert.equal(pc.offset, 0, 'offset starts at 0');
    pc.increment();
    assert.equal(pc.offset, 1, 'offset is incremented by 1 (1)');
    pc.increment();
    assert.equal(pc.offset, 2, 'offset is incremented by 1 (2)');
    pc.increment();
    assert.equal(pc.offset, 3, 'offset is incremented by 1 (3)');
  });

  QUnit.test('jump() sets the offset to a specified address', function(assert) {
    assert.equal(pc.offset, 0, 'offset starts at 0');
    pc.jump(10);
    assert.equal(pc.offset, 10, 'offset is set to 10');
    pc.jump(1337);
    assert.equal(pc.offset, 1337, 'offset is set to 1337');
  });

  QUnit.test('decrement() decreases the offset by 1', function(assert) {
    pc.jump(4);

    assert.equal(pc.offset, 4, 'offset starts at 4');
    pc.decrement();
    assert.equal(pc.offset, 3, 'offset is decremented by 1 (3)');
    pc.decrement();
    assert.equal(pc.offset, 2, 'offset is decremented by 1 (2)');
    pc.decrement();
    assert.equal(pc.offset, 1, 'offset is decremented by 1 (1)');
  });

  QUnit.test('fetch() returns the byte in ROM at the current offset', function(assert) {
    assert.equal(pc.fetch().toByte(), 0x01, 'byte at 0 is 0x01');
    pc.increment();
    assert.equal(pc.fetch().toByte(), 0x03, 'byte at 1 is 0x03');
    pc.jump(5);
    assert.equal(pc.fetch().toByte(), 0x37, 'byte at 5 is 0x37');
    pc.decrement();
    assert.equal(pc.fetch().toByte(), 0x13, 'byte at 4 is 0x13');
  });
}
