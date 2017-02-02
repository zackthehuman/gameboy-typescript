import { formatByte, getBit } from './worker/bitops';
import { Flags } from './worker/constants';

const input = document.querySelector('input[type="file"]') as HTMLInputElement;
const actionNextButton = document.querySelector('#action-next') as HTMLButtonElement;
const actionRunButton = document.querySelector('#action-run') as HTMLButtonElement;
const actionPauseButton = document.querySelector('#action-pause') as HTMLButtonElement;
const tileSet1Canvas = document.querySelector('#tile-set-1') as HTMLCanvasElement;
const tileSet1Context = tileSet1Canvas.getContext('2d');
const tileSet2Canvas = document.querySelector('#tile-set-2') as HTMLCanvasElement;
const tileSet2Context = tileSet2Canvas.getContext('2d');
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

const COLORS: Array<string> = [
  '#E0F7D0', // WHITE
  '#87BF6F', // LIGHT_GREY
  '#306950', // DARK_GREY
  '#081921'  // BLACK
];

function mergeBits(loBits: number, hiBits: number, bit: number): number {
  return getBit(loBits, bit) | (getBit(hiBits, bit) << 1);
}

function renderTileset(context: CanvasRenderingContext2D | null, tilesetData: Array<number>, palette: number): void {
  if (context !== null) {
    context.clearRect(0, 0, 256, 256);

    let tileX: number = 0;
    let tileY: number = 0;
    let row: number = 0;

    let tileBatch: Array<string> = [];

    const COLOR_MAP = [
      (getBit(palette, 1) << 1) | getBit(palette, 0),
      (getBit(palette, 3) << 1) | getBit(palette, 2),
      (getBit(palette, 5) << 1) | getBit(palette, 4),
      (getBit(palette, 7) << 1) | getBit(palette, 6)
    ];

    for (let i = 0; i < tilesetData.length - 1; i += 2) {
      const loBits: number = tilesetData[i];
      const hiBits: number = tilesetData[i + 1];
      const px0: number = mergeBits(loBits, hiBits, 7);
      const px1: number = mergeBits(loBits, hiBits, 6);
      const px2: number = mergeBits(loBits, hiBits, 5);
      const px3: number = mergeBits(loBits, hiBits, 4);
      const px4: number = mergeBits(loBits, hiBits, 3);
      const px5: number = mergeBits(loBits, hiBits, 2);
      const px6: number = mergeBits(loBits, hiBits, 1);
      const px7: number = mergeBits(loBits, hiBits, 0);

      if (row === 8) {
        row = 0;
        tileX += 1;
      }

      if (tileX === 32) {
        tileX = 0;
        tileY += 1;
      }

      context.fillStyle = COLORS[COLOR_MAP[px0]];
      context.fillRect((tileX * 8) + 0, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px1]];
      context.fillRect((tileX * 8) + 1, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px2]];
      context.fillRect((tileX * 8) + 2, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px3]];
      context.fillRect((tileX * 8) + 3, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px4]];
      context.fillRect((tileX * 8) + 4, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px5]];
      context.fillRect((tileX * 8) + 5, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px6]];
      context.fillRect((tileX * 8) + 6, (tileY * 8) + row, 1, 1);
      context.fillStyle = COLORS[COLOR_MAP[px7]];
      context.fillRect((tileX * 8) + 7, (tileY * 8) + row, 1, 1);

      row++;
    }
  }
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
    // console.log(msg.data.tileSet);
    renderTileset(tileSet1Context, msg.data.tileSetA, msg.data.palette);
    renderTileset(tileSet2Context, msg.data.tileSetB, msg.data.palette);
    break;
  }
};
