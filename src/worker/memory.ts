import { BOOT_ROM_DATA } from './constants';

function isBootROMAddress(address: number): boolean {
  return address >= 0 && address <= 0xFF;
}

export class Memory {
  private RAM: Uint8Array;
  private BOOT_ROM: Uint8Array;
  public isBootROMMode: boolean;

  constructor() {
    this.RAM = new Uint8Array(0xFFFF);
    this.BOOT_ROM = new Uint8Array(0x100); // 256
    this.isBootROMMode = false;

    // Load the boot ROM because it never changes.
    this.BOOT_ROM.set(BOOT_ROM_DATA);
  }

  clear(): void {
    this.RAM.fill(0);
  }

  loadBytes(bytes: ArrayLike<number>, offset?: number): void;
  loadBytes(bytes: Uint8Array, offset?: number): void {
    const offsetAddress: number = offset || 0;

    for (let i = 0; i < bytes.length; ++i) {
      this.writeByte(offsetAddress + i, bytes[i]);
    }
  }

  readByte(address: number): number {
    if (this.isBootROMMode && isBootROMAddress(address)) {
      return this.BOOT_ROM[address] & 0xFF;
    } else {
      return this.RAM[address] & 0xFF;
    }
  }

  readWord(address: number): number {
    if (this.isBootROMMode && isBootROMAddress(address)) {
      return (this.BOOT_ROM[address] << 8 | this.BOOT_ROM[address + 1]) & 0xFFFF;
    } else {
      return (this.RAM[address] << 8 | this.RAM[address + 1]) & 0xFFFF;
    }
  }

  writeByte(address: number, value: number): void {
    const byte: number = value & 0xFF;

    // The addresses E000-FE00 appear to access the internal
    // RAM the same as C000-DE00. (i.e. If you write a byte to
    // address E000 it will appear at C000 and E000.
    // Similarly, writing a byte to C000 will appear at C000
    // and E000.)
    if (address >= 0xE000 && address < 0xFE00) {
      this.RAM[address] = this.RAM[0xC000 + (address - 0xE000)] = byte;
    } else if (address >= 0xC000 && address < 0xDE00) {
      this.RAM[address] = this.RAM[0xE000 + (address - 0xC000)] = byte;
    } else {
      this.RAM[address] = byte;
    }
  }

  writeWord(address: number, value: number): void {
    this.writeByte(address, (value & 0xFF00) >> 8);
    this.writeByte(address + 1, value & 0xFF);
  }
}
