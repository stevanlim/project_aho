import { Device, Screen } from '@nativescript/core';

export function isTablet(): boolean {
  return Device.deviceType === 'Tablet' || Screen.mainScreen.widthDIPs >= 600;
}

export function getScreenWidth(): number {
  return Screen.mainScreen.widthDIPs;
}

export function getScreenHeight(): number {
  return Screen.mainScreen.heightDIPs;
}

export function getColumns(): number {
  const width = getScreenWidth();
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  if (width >= 600) return 3;
  return 2;
}
