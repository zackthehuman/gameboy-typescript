const input = document.querySelector('input[type="file"]') as HTMLInputElement;
const actionNextButton = document.querySelector('#action-next') as HTMLButtonElement;
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

const opcodeUI = document.getElementById('data-opcode') as HTMLElement;

function formatByte(value: number): string {
  const hex: string = value.toString(16);
  return ('00' + hex).substring(hex.length);
}

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

worker.onmessage = function(msg) {
  switch (msg.data.cmd) {
    case 'cycle':
    console.log('Pong Cycle!', msg.data.registers);
    updateRegisterUI(msg.data.registers);
    updateOpcodeUI(msg.data.opcode);
    break;
  }
};
