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

function readROMFile(file: File) {
  const reader = new FileReaderSync();
  const buffer = reader.readAsArrayBuffer(file);
  vm.loadROM(new Uint8Array(buffer));
}

function cycle() {
  // Pause at the end of the boot ROM.
  if (vm.pc.offset === 0x00FE) {
    if (!paused) {
      pause();
      return;
    }
  }

  const op: Opcode = vm.pc.fetch();

  if (!vm.didFinishBootROM) {
    const pcBefore: number = vm.pc.offset;
    ops.execOp(op);
    const pcAfter: number = vm.pc.offset;

    if (pcBefore === 0xFE && pcAfter === 0x100) {
      vm.didFinishBootROM = true;
      console.info('Finished boot ROM.');
    }
  } else {
    ops.execOp(op);
  }
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

  lastTick = Date.now();
}

function pause() {
  clearInterval(interval);
  paused = true;
  postMessage({
    cmd: 'debug',
    registers: vm.registers.toJSON(),
    opcode: vm.pc.fetch().toByte()
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
