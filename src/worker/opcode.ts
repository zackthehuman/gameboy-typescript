import { signedByte as toSigned } from './bitops';
import { MemoryAccess } from './memory';

export class OpcodeView {
  constructor(private memory: MemoryAccess, public offset: number) {
  }

  get instruction(): number {
    return this.memory.readByte(this.offset);
  }

  get byte(): number {
    return this.memory.readByte(this.offset + 1);
  }

  get signedByte(): number {
    return toSigned(this.byte);
  }

  get word(): number {
    return this.memory.readWord(this.offset + 1);
  }
}
