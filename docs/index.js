const button = document.getElementById('try');
const canvas = document.getElementById('canvas');

let destroy = () => {};

function start() {
  destroy();
  destroy = window.esp370u.emulate(canvas, {
    unsupportedWebHIDAPI: ['您的浏览器不支持 WebHID API！', '请联系客服升级浏览器'],
    unconnectedDevice: ['您的设备尚未连接！', '请确认设备已插入电脑，', '并点击我连接 ESP370U 签名板...'],
    onConfirm: (blob) => {
      destroy().then(() => {
        console.log(blob);
        window.open(URL.createObjectURL(blob));
        button.style.visibility = 'visible';
      }).catch((err) => {
        console.error(err);
      });
    },
  });
}

start();

button.onclick = start;
