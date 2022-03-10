/** http://www.signpro.com.cn/en/products/signsmall/sign_370U.html */

/** `[W, H, D]` in millimeter */
export const shellDimensions = <const> [154.5, 120, 9];

/** `[W, H]` in millimeter */
export const displayArea = <const> [76.78, 39.58];
/** `[horizontal, vertical]` in pixel */
export const displayResolution = <const> [240, 120];
/** `[W, H]` in millimeter */
export const displayActiveArea = <const> [76.78, 39.58];
/** millimeter */
export const displayPixelPitch = <const> [0.32, 0.33];
/** `[W, H]` in millimeter */
export const displayPixelSize = <const> [0.3, 0.31];
/** `[horizontal, vertical]` in degree */
export const displayViewingAngles = <const> [70, 70];
/** Display: White/Black */
export const displayTypicalContrastRatio = <const> 3.1;
/** Tr and Tf `[Total, White → Black, Black → White]` in millisecond */
export const displayTypicalResponseTime = <const> [307, 202, 105];

// Tablet
// /** millimeter */
// export const activeArea = <const> [76.78, 39.58];
// /** millimeter per dot */
// export const resolution = <const> 0.01;
// /** ±0.5 millimeter */
// export const coordinateAccuracy = <const> 0.5;
// /** +5 millimeter */
// export const accuracyAssuranceHeight = <const> 5;
// /** up to 50° from vertical */
// export const maximumPenTiltRange = <const> 50;
// /** pps */
// export const maxReportRate = <const> 150;

// /** 512 levels */
// export const stylusPressureSensitivity = <const> 512;

export const vendorId = 0x0b57;
export const productId = 0x8420;
export const reportId = 5;

export const maxX = 0x1800;
export const maxY = 0x2000;
export const maxZ = 0x0400;

export const activeRatioY = 1 / 8;

export const commands = {
  init: [0x88, 0x70],
  open: [0x11, 0x70],
  close: [0x22, 0x70],
  resign: [0x33, 0x70],
};

export const events = {
  /** 设备握手成功 */
  handshake: [
    // [0x88, 0x00, 0x74, 0x00, 0x14, 0x65, 0x00],
    [0x88, 0x00, null, null, null, null, null],
  ],
  /** 连接已经建立 */
  initialize: [
    [0x55, 0x05, 0x11, 0x70, 0xff, 0xff, 0xff],
  ],
  /** 主动断开连接 */
  finalize: [
    [0x55, 0x05, 0x22, 0x70, 0xff, 0xff, 0xff],
  ],
  /** 主动重置成功 */
  reset: [
    [0x55, 0x05, 0x33, 0x70, 0xff, 0xff, 0xff],
  ],
  /** 重签按钮被按下 */
  resign: [
    [0x55, null, null, null, null, 0x00, 0x00],
  ],
  /** 确认按钮被按下 */
  confirm: [
    [0x55, null, null, null, null, 0x00, 0xff],
  ],
  /** 抬起 */
  up: [
    [0xe0, null, null, null, null, null, null],
  ],
  /** 按下 */
  down: [
    [0xb0, null, null, null, null, null, null],
  ],
  /** 绘制 */
  move: [
    [0xa0, null, null, null, null, null, null],
    [0xa1, null, null, null, null, null, null],
  ],
};
