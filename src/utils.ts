/** Simulate HIDDeviceFilter rule */
function withFilter(filter: HIDDeviceFilter) {
  return (device: HIDDevice) => {
    if (filter.vendorId && filter.vendorId !== device.vendorId) return false;
    if (filter.productId && filter.productId !== device.productId) return false;
    return true;
  };
}

/** Resolve util device permission granted by user */
export async function makesureDevice(
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
