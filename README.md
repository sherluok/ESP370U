# ESP370U

基于 [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API) 的汉王签名数位板 [ESP370U](http://www.signpro.com.cn/en/products/signsmall/sign_370U.html) 浏览器驱动：
- 即插即用，不需要在操作系统中安装任何驱动或应用，也不用安装浏览器扩展或插件
- 支持向设备发送 `打开`、`清空`、`关闭` 等命令
- 支持监听设备的 `连接`、`断开`、`重签`、`确认`、笔的 `抬起`、`放下`、`移动` 等事件
- 支持获取事件的 `X坐标`、`Y坐标`、`Z按压力度` 的原始数据和归一化数据

示例: [https://esp370u.sherluok.cn](https://esp370u.sherluok.cn)
