export type DeviceKind = 'iphone' | 'ipad' | 'mac-safari' | 'mac-chrome' | 'android' | 'desktop-other';

export function detectDevice(ua: string = navigator.userAgent, platform: string = navigator.platform, maxTouch = navigator.maxTouchPoints ?? 0): DeviceKind {
  const isIPhone = /iPhone|iPod/.test(ua);
  const isIPad = /iPad/.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
  if (isIPhone) return 'iphone';
  if (isIPad) return 'ipad';
  if (/Android/.test(ua)) return 'android';
  const isMac = /Macintosh|Mac OS X/.test(ua);
  const isChromium = /Chrome|Chromium|CriOS|Edg\//.test(ua);
  const isSafari = /Safari/.test(ua) && !isChromium;
  if (isMac && isSafari) return 'mac-safari';
  if (isMac && isChromium) return 'mac-chrome';
  return 'desktop-other';
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

export function isMacLike(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac OS X/.test(navigator.userAgent);
}
