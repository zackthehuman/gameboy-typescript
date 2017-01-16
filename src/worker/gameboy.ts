import createOperations from './operations';
import createVirtualMachine from './vm';

export default createOperations;

const vm = createVirtualMachine();
var ops = createOperations(vm);

function readROMFile(file: File) {
  const reader = new FileReaderSync();
  const buffer = reader.readAsArrayBuffer(file);
  vm.loadROM(new Uint8Array(buffer));
}

function cycle() {
  const opcode = vm.pc.fetch();
  vm.pc.increment();
  ops.execOp(opcode);
  postMessage({
    cmd: 'cycle',
    registers: vm.registers.toJSON(),
    opcode: opcode.toByte()
  });
}

onmessage = function(msg: MessageEvent) {
  switch (msg.data.cmd) {
    case 'load':
      console.log('Reading ROM...');
      readROMFile(msg.data.rom);
      break;
    case 'cycle':
      cycle();
      break;
    case 'keydown':
      break;
    case 'keyup':
      break;
  }
}
