import { signedByte } from './bitops';

export class OpcodeImpl {
  constructor(public raw: number) {
  }

  get hi(): number {
    return (this.raw & 0xF0) >> 4;
  }

  get lo(): number {
    return this.raw & 0x0F;
  }

  toByte(): number {
    return this.raw & 0xFF;
  }

  toSignedByte(): number {
    return signedByte(this.toByte());
  }
}
