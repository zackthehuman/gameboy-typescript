import { Memory } from '../../worker/memory';
import { MMU } from '../../worker/mmu';

export default function memoryTests() {
  QUnit.module('worker/mmu');

  QUnit.test('readByte reads a single byte', function(assert) {
    const mem = new MMU(new Memory());
    mem.loadBytes([0x40, 0x2]);

    assert.equal(mem.readByte(0), 0x40, 'byte at 0 should be 0x40');
    assert.equal(mem.readByte(1), 0x2, 'byte at 1 should be 0x2');
  });

  QUnit.test('readWord reads a two consecutive bytes', function(assert) {
    const mem = new MMU(new Memory());
    mem.loadBytes([0x40, 0x02, 0xB3, 0x3F]);

    assert.equal(mem.readWord(0), 0x4002, 'word at 0 should be 0x4002');
    assert.equal(mem.readWord(2), 0xB33F, 'word at 2 should be 0xB33F');
  });

  QUnit.test('internal RAM is echoed from 0xC000 to 0xE000', function(assert) {
    const mem = new MMU(new Memory());

    mem.loadBytes([0x8, 0x6, 0x7, 0x5, 0x3, 0x0, 0x9], 0xC000);
    assert.equal(mem.readByte(0xE000), 0x8, 'byte at 0xE000 should be 0x8');
    assert.equal(mem.readByte(0xE001), 0x6, 'byte at 0xE001 should be 0x6');
    assert.equal(mem.readByte(0xE002), 0x7, 'byte at 0xE002 should be 0x7');
    assert.equal(mem.readByte(0xE003), 0x5, 'byte at 0xE003 should be 0x5');
    assert.equal(mem.readByte(0xE004), 0x3, 'byte at 0xE004 should be 0x3');
    assert.equal(mem.readByte(0xE005), 0x0, 'byte at 0xE005 should be 0x0');
    assert.equal(mem.readByte(0xE006), 0x9, 'byte at 0xE006 should be 0x9');

    mem.loadBytes([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7], 0xE000);
    assert.equal(mem.readByte(0xC000), 0x1, 'byte at 0xC000 should be 0x1');
    assert.equal(mem.readByte(0xC001), 0x2, 'byte at 0xC001 should be 0x2');
    assert.equal(mem.readByte(0xC002), 0x3, 'byte at 0xC002 should be 0x3');
    assert.equal(mem.readByte(0xC003), 0x4, 'byte at 0xC003 should be 0x4');
    assert.equal(mem.readByte(0xC004), 0x5, 'byte at 0xC004 should be 0x5');
    assert.equal(mem.readByte(0xC005), 0x6, 'byte at 0xC005 should be 0x6');
    assert.equal(mem.readByte(0xC006), 0x7, 'byte at 0xC006 should be 0x7');

    const data: Array<number> = new Array<number>(7680);
    data.fill(42);
    mem.loadBytes(data, 0xC000);

    for (let i = 0; i < data.length; ++i) {
      assert.equal(mem.readByte(0xC000 + i), mem.readByte(0xE000 + i), 'byte at 0xC000 + i should equal byte at 0xE000 + i');
    }
  });
}
