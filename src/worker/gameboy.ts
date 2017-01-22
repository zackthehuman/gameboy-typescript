import createOperations from './operations';
import createVirtualMachine from './vm';

export default createOperations;

function panicHandler(message: string): void {
  pause();
  console.error(message);
}

const vm = createVirtualMachine(panicHandler);
var ops = createOperations(vm);

function readROMFile(file: File) {
  const reader = new FileReaderSync();
  const buffer = reader.readAsArrayBuffer(file);
  vm.loadROM(new Uint8Array(buffer));
}

function cycle() {
  ops.execOp(vm.pc.fetch());
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
  lastTick = Date.now();
  interval = setInterval(tick, 10);
  paused = false;
}

function run() {
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
