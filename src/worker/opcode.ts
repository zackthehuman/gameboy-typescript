import { signedByte as toSigned } from './bitops';
import { MemoryAccess } from './memory';

export class OpcodeView {
  public size: number;

  constructor(private memory: MemoryAccess, public offset: number) {
    this.size = 0;
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

  private get loByte(): number {
    return this.memory.readByte(this.offset + 1);
  }

  private get hiByte(): number {
    return this.memory.readByte(this.offset + 2);
  }

  get word(): number {
    // We don't use `memory.readWord` here because the high and low bytes are in
    // reverse order compared to how they are laid out in memory.
    const { loByte, hiByte } = this;
    return (hiByte << 8 | loByte) & 0xFFFF;
  }
}
