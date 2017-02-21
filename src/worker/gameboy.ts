import createOperations from './operations';
import createVirtualMachine from './vm';
import { Opcode } from './interfaces';

export default createOperations;

function panicHandler(message: string): void {
  pause();
  console.error(message);
}

const vm = createVirtualMachine(panicHandler);
const ops = createOperations(vm);

interface Audio {
  update(cycleCount: number): void;
}

interface Video {
  update(cycleCount: number): void;
}

interface Input {
  update(cycleCount: number): void;
}

const audio: Audio = {
  update(cycleCount: number): void {
    // console.log(cycleCount);
  }
};

const input: Input = {
  update(cycleCount: number): void {
    // console.log(cycleCount);
  }
};

const video: Video = {
  update(cycleCount: number): void {
    // console.log(cycleCount);
  }
};

function readROMFile(file: File) {
  const reader = new FileReaderSync();
  const buffer = reader.readAsArrayBuffer(file);
  vm.loadROM(new Uint8Array(buffer));
}

function cycle() {
  const op: Opcode = vm.pc.fetch();
  let cycleCount: number = 0;

  if (!vm.didFinishBootROM) {
    const pcBefore: number = vm.pc.offset;
    cycleCount = ops.execOp(op);
    const pcAfter: number = vm.pc.offset;

    if (pcBefore === 0xFE && pcAfter === 0x100) {
      vm.didFinishBootROM = true;
      console.info('Finished boot ROM.');
    }
  } else {
    cycleCount = ops.execOp(op);
  }

  audio.update(cycleCount);
  input.update(cycleCount);
  video.update(cycleCount);
}

var handle = 0;
let interval: number;
let lastTick: number;
let paused: boolean = false;

function tick() {
  let elapsed = Date.now() - lastTick;
  let cyclesPerTick = (elapsed * 41943 / 1000) | 0;

  for (let i = 0; i < cyclesPerTick; i++) {
    if (paused) {
      break;
    }

    cycle();
  }
  // const tileSetA: Array<number> = new Array<number>((0x8FFF - 0x8800) + 1);
  // const tileSetB: Array<number> = new Array<number>((0x87FF - 0x8000) + 1);

  // for (let i = 0x8800; i < 0x8FFF; ++i) {
  //   tileSetA[i - 0x8800] = vm.memory.readByte(i);
  // }

  // for (let i = 0x8000; i < 0x87FF; ++i) {
  //   tileSetB[i - 0x8000] = vm.memory.readByte(i);
  // }

  // postMessage({
  //   cmd: 'debug',
  //   registers: vm.registers.toJSON(),
  //   opcode: vm.pc.fetch().toByte(),
  //   tileSetA,
  //   tileSetB
  // });
  lastTick = Date.now();
}

function pause() {
  clearInterval(interval);
  paused = true;

  const tileSetA: Array<number> = new Array<number>((0x97FF - 0x8800) + 1);
  const tileSetB: Array<number> = new Array<number>((0x8FFF - 0x8000) + 1);

  for (let i = 0x8800; i < 0x97FF; ++i) {
    tileSetA[i - 0x8800] = vm.memory.readByte(i);
  }

  for (let i = 0x8000; i < 0x8FFF; ++i) {
    tileSetB[i - 0x8000] = vm.memory.readByte(i);
  }

  const palette: number = vm.memory.readByte(0xFF47);

  postMessage({
    cmd: 'debug',
    registers: vm.registers.toJSON(),
    opcode: vm.pc.fetch().byte,
    tileSetA,
    tileSetB,
    palette
  });
}

function resume() {
  // HACK (temporary)
  // This makes it look like we've drawn the screen from a register perspective.
  vm.memory.writeByte(0xFF44, 0x90);
  lastTick = Date.now();
  interval = setInterval(tick, 10);
  paused = false;
}

function run() {
  paused = false;
  cycle();
  scheduleNextRun();
}

function scheduleNextRun() {
  clearTimeout(handle);
  handle = setTimeout(run, 0);
}

onmessage = function(msg: MessageEvent) {
  switch (msg.data.cmd) {
    case 'load':
      console.log('Reading ROM...');
      readROMFile(msg.data.rom);
      break;
    case 'cycle':
      cycle();
      pause();
      break;
    case 'run':
      resume();
      break;
    case 'pause':
      pause();
      break;
  }
}
