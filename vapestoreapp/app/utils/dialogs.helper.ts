import { Dialogs, Frame } from '@nativescript/core';

/**
 * Show a success alert
 */
export function showSuccess(message: string, title: string = 'Berhasil'): Promise<void> {
  return Dialogs.alert({
    title,
    message,
    okButtonText: 'OK'
  });
}

/**
 * Show an error alert
 */
export function showError(message: string, title: string = 'Error'): Promise<void> {
  return Dialogs.alert({
    title,
    message,
    okButtonText: 'OK'
  });
}

/**
 * Show a confirm dialog
 */
export function showConfirm(message: string, title: string = 'Konfirmasi'): Promise<boolean> {
  return Dialogs.confirm({
    title,
    message,
    okButtonText: 'Ya',
    cancelButtonText: 'Tidak'
  });
}

/**
 * Navigate to a page
 */
export function navigateTo(path: string, context?: any, clearHistory: boolean = false, useRoot?: boolean): void {
  const isFullScreen = useRoot ||
    path.includes('cart-page') ||
    path.includes('receipt-page') ||
    path.includes('product-detail-page') ||
    path.includes('product-form-page') ||
    path.includes('stock-') ||
    path.includes('settings-page') ||
    path.includes('login-page') ||
    path.includes('pin-page') ||
    path.includes('main-page');

  let targetFrame: Frame | undefined;
  if (isFullScreen) {
    targetFrame = Frame.getFrameById('rootFrame') || Frame.topmost();
  } else {
    targetFrame = Frame.topmost();
  }

  if (targetFrame) {
    targetFrame.navigate({
      moduleName: path,
      context,
      clearHistory,
      animated: true,
      transition: {
        name: 'slide',
        duration: 250,
        curve: 'easeInOut'
      }
    });
  }
}

/**
 * Navigate back
 */
export function goBack(): void {
  const topmost = Frame.topmost();
  if (topmost && topmost.canGoBack()) {
    topmost.goBack();
    return;
  }
  const rootFrame = Frame.getFrameById('rootFrame');
  if (rootFrame && rootFrame.canGoBack()) {
    rootFrame.goBack();
  }
}
