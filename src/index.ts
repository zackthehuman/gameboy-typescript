import { formatByte, getBit } from './worker/bitops';
import { Flags } from './worker/constants';

const input = document.querySelector('input[type="file"]') as HTMLInputElement;
const actionNextButton = document.querySelector('#action-next') as HTMLButtonElement;
const actionRunButton = document.querySelector('#action-run') as HTMLButtonElement;
const actionPauseButton = document.querySelector('#action-pause') as HTMLButtonElement;
const worker = new Worker('worker/gameboy.js');

const regUIForA = document.getElementById('register-A') as HTMLElement;
const regUIForB = document.getElementById('register-B') as HTMLElement;
const regUIForC = document.getElementById('register-C') as HTMLElement;
const regUIForD = document.getElementById('register-D') as HTMLElement;
const regUIForE = document.getElementById('register-E') as HTMLElement;
const regUIForF = document.getElementById('register-F') as HTMLElement;
const regUIForH = document.getElementById('register-H') as HTMLElement;
const regUIForL = document.getElementById('register-L') as HTMLElement;
const regUIForSP = document.getElementById('register-SP') as HTMLElement;
const regUIForPC = document.getElementById('register-PC') as HTMLElement;

const bitUIForFlagZ = document.getElementById('flag-bit-7') as HTMLElement;
const bitUIForFlagN = document.getElementById('flag-bit-6') as HTMLElement;
const bitUIForFlagH = document.getElementById('flag-bit-5') as HTMLElement;
const bitUIForFlagC = document.getElementById('flag-bit-4') as HTMLElement;

const opcodeUI = document.getElementById('data-opcode') as HTMLElement;

function formatWord(value: number): string {
  const hex: string = value.toString(16);
  return ('0000' + hex).substring(hex.length);
}

function updateRegisterUI(values): void {
  regUIForA.innerText = formatByte(values.A);
  regUIForB.innerText = formatByte(values.B);
  regUIForC.innerText = formatByte(values.C);
  regUIForD.innerText = formatByte(values.D);
  regUIForE.innerText = formatByte(values.E);
  regUIForF.innerText = formatByte(values.F);
  regUIForH.innerText = formatByte(values.H);
  regUIForL.innerText = formatByte(values.L);
  regUIForSP.innerText = formatWord(values.SP);
  regUIForPC.innerText = formatWord(values.PC);
}

function updateOpcodeUI(opcode): void {
  opcodeUI.innerText = formatByte(opcode);
}

function updateFlagUI(flagsRegister: number): void {
  bitUIForFlagZ.innerText = String(getBit(flagsRegister, Flags.Z));
  bitUIForFlagN.innerText = String(getBit(flagsRegister, Flags.N));
  bitUIForFlagH.innerText = String(getBit(flagsRegister, Flags.H));
  bitUIForFlagC.innerText = String(getBit(flagsRegister, Flags.C));
}

input.addEventListener('change', function(this: HTMLInputElement, evt) {
  var files = this.files;
  if (files && files.length > 0) {
    var load = {
      cmd: 'load',
      rom: files[0]
    };

    console.log('Loading ROM...');

    worker.postMessage(load);
  }
}, false);

actionNextButton.addEventListener('click', function(this: HTMLButtonElement, evt) {
  const cycle = {
    cmd: 'cycle'
  };
  worker.postMessage(cycle);
});

actionRunButton.addEventListener('click', function(this: HTMLButtonElement, evt) {
  const run = {
    cmd: 'run'
  };
  worker.postMessage(run);
});

actionPauseButton.addEventListener('click', function(this: HTMLButtonElement, evt) {
  const pause = {
    cmd: 'pause'
  };
  worker.postMessage(pause);
});

worker.onmessage = function(msg) {
  switch (msg.data.cmd) {
    case 'cycle':
    break;
    case 'debug':
    updateRegisterUI(msg.data.registers);
    updateFlagUI(msg.data.registers.F);
    updateOpcodeUI(msg.data.opcode);
    break;
  }
};
