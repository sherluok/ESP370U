import { ESP370U } from './ESP370U';

function x(value: number) {
  return Math.ceil(value) - .5;
}

function y(value: number) {
  return Math.ceil(value) - .5;
}

const {
  MAX_X,
  MAX_Y,
  MIN_VALID_Y,
  MAX_VALID_Y,
} = ESP370U;

function clearESP370U<T>(ctx: CanvasRenderingContext2D, then: (width: number, height: number) => T) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = 'rgb(79, 101, 89)';
  ctx.fillRect(0, 0, width, height);
  return then(width, height);
}

function resetESP370U(ctx: CanvasRenderingContext2D) {
  clearESP370U(ctx, (width, height) => {
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.moveTo(x(0), y(ESP370U.MAX_VALID_Y / ESP370U.MAX_Y * height + 5));
    ctx.lineTo(x(width), y(ESP370U.MAX_VALID_Y / ESP370U.MAX_Y * height + 5));
    ctx.moveTo(x(width / 2), y(ESP370U.MAX_VALID_Y / ESP370U.MAX_Y * height + 5));
    ctx.lineTo(x(width / 2), y(height));
    ctx.moveTo(x(0), y(ESP370U.MIN_VALID_Y / ESP370U.MAX_Y * height));
    ctx.lineTo(x(width), y(ESP370U.MIN_VALID_Y / ESP370U.MAX_Y * height));
    ctx.stroke();
  
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 ${(MAX_Y - MAX_VALID_Y) / MAX_Y * height / 1.3}px system-ui`;
    ctx.fillText('重', 1 / 2 / 3 * width * 1, ((MAX_VALID_Y + MAX_Y) / 2 / MAX_Y * 1.015) * height);
    ctx.fillText('签', 1 / 2 / 3 * width * 2, ((MAX_VALID_Y + MAX_Y) / 2 / MAX_Y * 1.015) * height);
    ctx.fillText('确', 1 / 2 / 3 * width * 4, ((MAX_VALID_Y + MAX_Y) / 2 / MAX_Y * 1.015) * height);
    ctx.fillText('认', 1 / 2 / 3 * width * 5, ((MAX_VALID_Y + MAX_Y) / 2 / MAX_Y * 1.015) * height);
    ctx.fillText('请', 1 / 14 * width * 1, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('签', 1 / 14 * width * 2, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('名', 1 / 14 * width * 3, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('•', 1 / 14 * width * 4, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('•', 1 / 14 * width * 5, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('•', 1 / 14 * width * 6, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('•', 1 / 14 * width * 7, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('•', 1 / 14 * width * 8, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
    ctx.fillText('•', 1 / 14 * width * 9, (MIN_VALID_Y / 2 / MAX_Y * 1.2) * height);
  });
}

function guide(ctx: CanvasRenderingContext2D, ...contents: string[]) {
  return clearESP370U(ctx, (width, height) => {
    const fontSize = 20;
    const lineHeight = fontSize * 1.6;
    const offsetY = -1 * (contents.length - 1) * lineHeight / 2;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 ${fontSize}px system-ui`;
    contents.forEach((line, i) => {
      ctx.fillText(line, width / 2, height / 2 + offsetY + lineHeight * i);
    });
  });
}

interface IOptions {
  onConfirm?: (blob: Blob) => void;
  unsupportedWebHIDAPI: string[];
  unconnectedDevice: string[];
}

export async function emulate(canvas: HTMLCanvasElement, options: IOptions) {
  const { devicePixelRatio: dpr } = window;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Connot get CanvasRenderingContext2D!');

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = canvas.width;
  bgCanvas.height = canvas.height;
  const bgCtx = bgCanvas.getContext('2d')!;

  const signCanvas = document.createElement('canvas');
  signCanvas.width = canvas.width;
  signCanvas.height = canvas.height;
  const signCtx = signCanvas.getContext('2d')!;

  (function animate() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(signCanvas, 0, 0);
    requestAnimationFrame(animate);
  })();

  if (!('hid' in navigator)) return guide(bgCtx, ...options.unsupportedWebHIDAPI);

  let device;
  while (!device) {
    const devices = await navigator.hid.getDevices();
    device = devices.find(({ vendorId, productId }) => vendorId === ESP370U.VENDOR_ID && productId === ESP370U.PRODUCT_ID);
    if (!device) {
      guide(bgCtx, ...options.unconnectedDevice);
      await new Promise((resolve) => canvas.addEventListener('click', resolve, { once: true }));
      [device] = await navigator.hid.requestDevice({ filters: [{ vendorId: ESP370U.VENDOR_ID, productId: ESP370U.PRODUCT_ID }] });
    }
  }

  const esp370u = new ESP370U(device);

  const moves: number[] = [];
  const offs = [
    esp370u.on('handshake', async (e) => {
      e.print('握手成功');
      esp370u.once('initialize').then((e) => {
        e.print('设备初始化成功');
      }).catch((err) => {
        console.error('设备无响应');
      });
      esp370u.send('open');
    }),
    esp370u.on('resign', (e) => {
      e.print('设备主动重签');
      signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
    }),
    esp370u.on('confirm', (e) => {
      e.print('设备主动确认');
      signCanvas.toBlob((blob) => {
        signCtx.clearRect(0, 0, signCanvas.width, signCanvas.height);
        if (blob) {
          // window.open(URL.createObjectURL(blob));
          options.onConfirm?.(blob);
          esp370u.send('close');
        }
      });
    }),
    esp370u.on('move', (e) => {
      const { x, y, z } = e.normalize();
      if (!z) {
        signCtx.closePath();
        moves.splice(0);
        return;
      }
      moves.push(x * width * dpr, y * height * dpr);
      const { length } = moves;
      if (length >= 4) {
        const [x2, y2, x1, y1] = moves.slice(length - 4);
        const [cX, cY] = [(x2 + x1) / 2, (y2 + y1) / 2];
        signCtx.lineCap = 'round';
        signCtx.lineJoin = 'round';
        signCtx.lineWidth = Math.pow(z, 2) * 5;
        signCtx.strokeStyle = '#000';
        signCtx.quadraticCurveTo(x1, y1, cX, cY);
        signCtx.stroke();
        signCtx.beginPath();
        signCtx.moveTo(cX, cY);
      } else {
        signCtx.beginPath();
        signCtx.moveTo(x * width * dpr, y * height * dpr);
        signCtx.stroke();
      }
    }),
  ];

  resetESP370U(bgCtx);
  await device.open();
  esp370u.send('init');
}
