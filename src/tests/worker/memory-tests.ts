import { Memory } from '../../worker/memory';

export default function memoryTests() {
  QUnit.module('worker/memory');

  QUnit.test('readByte reads a single byte', function(assert) {
    const mem = new Memory();
    mem.loadBytes([0x40, 0x2]);

    assert.equal(mem.readByte(0), 0x40, 'byte at 0 should be 0x40');
    assert.equal(mem.readByte(1), 0x2, 'byte at 1 should be 0x2');
  });

  QUnit.test('readWord reads a two consecutive bytes', function(assert) {
    const mem = new Memory();
    mem.loadBytes([0x40, 0x02, 0xB3, 0x3F]);

    assert.equal(mem.readWord(0), 0x4002, 'word at 0 should be 0x4002');
    assert.equal(mem.readWord(2), 0xB33F, 'word at 2 should be 0xB33F');
  });
}
