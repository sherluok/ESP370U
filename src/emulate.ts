import { ESP370U } from './ESP370U';
import { activeRatioY, displayResolution, productId, vendorId } from './specifications';

/** Simulate HIDDeviceFilter rule */
function withFilter(filter: HIDDeviceFilter) {
  return (device: HIDDevice) => {
    if (filter.vendorId && filter.vendorId !== device.vendorId) return false;
    if (filter.productId && filter.productId !== device.productId) return false;
    return true;
  };
}

/** Resolve util device permission granted by user */
async function makesureDevice(
  filter: HIDDeviceFilter,
  suspense: (onUserGesture: (teardown: any) => void) => void,
) {
  let device;
  while (!device) {
    const devices = await navigator.hid.getDevices();
    device = devices.find(withFilter(filter));
    if (!device) {
      const teardown = await new Promise(suspense);
      if (typeof teardown === 'function') await teardown();
      [device] = await navigator.hid.requestDevice({ filters: [filter] });
    }
  }
  return device;
}

/** Create canvas that will not be adding into DOM nodes */
function createOffscreenCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  return [canvas, context] as const;
}

/** Magic of rendering clear line  */
function x(value: number) {
  return Math.ceil(value) - .5;
}

/** Magic of rendering clear line  */
function y(value: number) {
  return Math.ceil(value) - .5;
}

function guide(ctx: CanvasRenderingContext2D, ...contents: string[]) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

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
}

interface IOptions {
  onConfirm?: (blob: Blob) => void;
  unsupportedWebHIDAPI: string[];
  unconnectedDevice: string[];
  background?: boolean | string | CanvasGradient | CanvasPattern;
  ui?: boolean;
}

export function emulate(canvas: HTMLCanvasElement, options: IOptions) {
  let esp370u: ESP370U;
  let requestID = -1;
  let offs: (() => void)[];
  let destroied = false;

  const teardown = async () => {
    if (!destroied) {
      destroied = true;
      cancelAnimationFrame(requestID);
      await esp370u?.destroy();
      offs.forEach((off) => off());
    }
  };

  (async () => {
    const { background = true, ui = background } = options;
    const { devicePixelRatio: dpr } = window;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) throw new Error('Connot get CanvasRenderingContext2D!');

    // Force contents to fit display ratio
    const rectRatio = rect.width / rect.height;
    const displayRatio = displayResolution[0] / displayResolution[1];
    const [width, height] = displayRatio > rectRatio ?
      [rect.width * dpr, rect.width * dpr / displayRatio] :
      [rect.height * dpr * displayRatio, rect.height * dpr];

    // Create Offscreen Canvases
    const [bgLayer, bgCtx] = createOffscreenCanvas(width, height);
    const [signLayer, signCtx] = createOffscreenCanvas(width, height);
    const [workLayer, workCtx] = createOffscreenCanvas(width, height);
    const [uiLayer, uiCtx] = createOffscreenCanvas(width, height);

    // Vertical edges of working area
    const minValidH = activeRatioY * height;
    const maxValidH = (1 - activeRatioY) * height;

    if (background) {
      const bgColor = typeof background === 'boolean' ? '#4f6559' : background;
      bgCtx.fillStyle = bgColor;
      bgCtx.fillRect(0, 0, width, height);
    }

    if (ui) {
      // Draw lines
      uiCtx.strokeStyle = '#000';
      uiCtx.lineWidth = Math.ceil(width / 660);
      uiCtx.beginPath();
      uiCtx.moveTo(x(0), y(minValidH));
      uiCtx.lineTo(x(width), y(minValidH));
      uiCtx.moveTo(x(0), y(maxValidH));
      uiCtx.lineTo(x(width), y(maxValidH));
      uiCtx.moveTo(x(width / 2), y(maxValidH));
      uiCtx.lineTo(x(width / 2), y(height));
      uiCtx.stroke();
      uiCtx.closePath();
      // Draw texts
      uiCtx.fillStyle = '#000';
      uiCtx.textAlign = 'center';
      uiCtx.textBaseline = 'middle';
      const fontSize = height * activeRatioY * 0.875;
      uiCtx.font = `300 ${fontSize}px system-ui`;
      const buttonBaseline = (1 - activeRatioY / 2) * height;
      uiCtx.fillText('重', width * 1 / 6, buttonBaseline);
      uiCtx.fillText('签', width * 2 / 6, buttonBaseline);
      uiCtx.fillText('确', width * 4 / 6, buttonBaseline);
      uiCtx.fillText('认', width * 5 / 6, buttonBaseline);
      const titleBaseline = activeRatioY / 2 * height;
      uiCtx.fillText('请', width * 1 / 14, titleBaseline);
      uiCtx.fillText('签', width * 2 / 14, titleBaseline);
      uiCtx.fillText('名', width * 3 / 14, titleBaseline);
      uiCtx.fillText('•', width * 4 / 14, titleBaseline);
      uiCtx.fillText('•', width * 5 / 14, titleBaseline);
      uiCtx.fillText('•', width * 6 / 14, titleBaseline);
      uiCtx.fillText('•', width * 7 / 14, titleBaseline);
      uiCtx.fillText('•', width * 8 / 14, titleBaseline);
      uiCtx.fillText('•', width * 9 / 14, titleBaseline);
    }

    // React to sign layer changes
    (function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bgLayer, 0, 0);
      ctx.drawImage(signLayer, 0, 0);
      requestID = requestAnimationFrame(animate);
    })();

    if (!('hid' in navigator)) return guide(signCtx, ...options.unsupportedWebHIDAPI);

    // Wait util device are found and permissions are obtained
    esp370u = await ESP370U.makesure((onClick) => {
      guide(signCtx, ...options.unconnectedDevice);
      canvas.addEventListener('click', onClick, { once: true });
    });

    cancelAnimationFrame(requestID);
    signCtx.clearRect(0, 0, width, height);
    // React to sign layer changes with ui layer on top
    (function animate() {
      // Cut sign layer into worklayer
      workCtx.clearRect(0, 0, width, height);
      workCtx.drawImage(signLayer, 0, 0);
      workCtx.clearRect(0, 0, width, minValidH);
      workCtx.clearRect(0, maxValidH, width, minValidH);
      // Draw layers
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(bgLayer, 0, 0);
      ctx.drawImage(workLayer, 0, 0);
      ctx.drawImage(uiLayer, 0, 0);
      requestID = requestAnimationFrame(animate);
    })();

    const moves: number[] = [];
    offs = [
      esp370u.on('?', (e) => {
        e.print('未知事件');
      }),
      esp370u.on('handshake', async (e) => {
        e.print('握手成功');
        esp370u.once('initialize', 1000).then((e) => {
          e.print('设备初始化成功');
        }).catch((err) => {
          console.error('设备无响应');
        });
        esp370u.on('finalize', (e) => {
          e.print('设备断开连接');
        });
        esp370u.send('open');
      }),
      esp370u.on('resign', (e) => {
        e.print('设备主动重签');
        signCtx.clearRect(0, 0, width, height);
      }),
      esp370u.on('confirm', (e) => {
        e.print('设备主动确认');
        signLayer.toBlob((blob) => {
          signCtx.clearRect(0, 0, width, height);
          if (blob) {
            options.onConfirm?.(blob);
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

    await esp370u.open();
  })();

  return teardown;
}
