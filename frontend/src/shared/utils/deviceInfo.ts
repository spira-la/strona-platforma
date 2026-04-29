/**
 * Device information utility for debugging media issues.
 * Extracts device model, OS version, browser name/version from the user agent.
 * Used in console logs to identify problematic devices when camera/mic errors occur.
 */

export interface DeviceInfo {
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  deviceModel: string;
  isOldDevice: boolean;
  userAgent: string;
}

let cachedDeviceInfo: DeviceInfo | null = null;

export function getDeviceInfo(): DeviceInfo {
  if (cachedDeviceInfo) return cachedDeviceInfo;

  const ua = navigator.userAgent;
  let os = 'Unknown';
  let osVersion = '';
  let browser = 'Unknown';
  let browserVersion = '';
  let deviceModel = '';
  let isOldDevice = false;

  // --- OS Detection ---
  const androidMatch = ua.match(/Android\s([\d.]+)/);
  const iosMatch = ua.match(/(?:iPhone|iPad|iPod).*?OS\s([\d_]+)/);
  const macMatch = ua.match(/Mac OS X\s([\d_.]+)/);
  const windowsMatch = ua.match(/Windows NT\s([\d.]+)/);

  if (androidMatch) {
    os = 'Android';
    osVersion = androidMatch[1];
    // Extract device model: everything between "; " and " Build/" or ")"
    // eslint-disable-next-line sonarjs/slow-regex -- ua-parsing on a trusted browser-controlled string; bounded by `[^;)]` and `\)`
    const modelMatch = ua.match(/;\s*([^;)]+?)(?:\s+Build\/|\))/);
    if (modelMatch) {
      deviceModel = modelMatch[1].trim();
    }
    if (Number.parseInt(osVersion) <= 10) isOldDevice = true;
  } else if (iosMatch) {
    os = 'iOS';
    osVersion = iosMatch[1].replaceAll('_', '.');
    const iosDeviceMatch = ua.match(/(iPhone|iPad|iPod)/);
    deviceModel = iosDeviceMatch ? iosDeviceMatch[1] : '';
    if (Number.parseInt(osVersion) <= 14) isOldDevice = true;
  } else if (macMatch) {
    os = 'macOS';
    osVersion = macMatch[1].replaceAll('_', '.');
  } else if (windowsMatch) {
    os = 'Windows';
    osVersion = windowsMatch[1];
  }

  // --- Browser Detection (order matters: more specific first) ---
  const samsungMatch = ua.match(/SamsungBrowser\/([\d.]+)/);
  const edgeMatch = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/);
  const operaMatch = ua.match(/(?:OPR|Opera)\/([\d.]+)/);
  const firefoxMatch = ua.match(/Firefox\/([\d.]+)/);
  const chromeMatch = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/);
  // eslint-disable-next-line sonarjs/slow-regex -- ua-parsing on a trusted browser-controlled string
  const safariMatch = ua.match(/Version\/([\d.]+).*Safari/);

  if (samsungMatch) {
    browser = 'Samsung Internet';
    browserVersion = samsungMatch[1];
    isOldDevice = true; // Samsung Internet often runs on older WebRTC stack
  } else if (edgeMatch) {
    browser = 'Edge';
    browserVersion = edgeMatch[1];
  } else if (operaMatch) {
    browser = 'Opera';
    browserVersion = operaMatch[1];
  } else if (firefoxMatch) {
    browser = 'Firefox';
    browserVersion = firefoxMatch[1];
  } else if (chromeMatch) {
    browser = os === 'iOS' ? 'Chrome iOS' : 'Chrome';
    browserVersion = chromeMatch[1];
    if (Number.parseInt(browserVersion) <= 90) isOldDevice = true;
  } else if (safariMatch) {
    browser = 'Safari';
    browserVersion = safariMatch[1];
  }

  cachedDeviceInfo = {
    os,
    osVersion,
    browser,
    browserVersion,
    deviceModel,
    isOldDevice,
    userAgent: ua,
  };

  return cachedDeviceInfo;
}

/**
 * Returns a compact string for console logging.
 * Example: "Android 10 | Samsung SM-A105F | Chrome 89.0.4389.105"
 */
export function getDeviceInfoString(): string {
  const info = getDeviceInfo();
  const parts = [`${info.os} ${info.osVersion}`];
  if (info.deviceModel) parts.push(info.deviceModel);
  parts.push(`${info.browser} ${info.browserVersion}`);
  if (info.isOldDevice) parts.push('[OLD DEVICE]');
  return parts.join(' | ');
}
