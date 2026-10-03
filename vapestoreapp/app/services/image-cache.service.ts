import { Http, knownFolders, path, File, Folder, Observable } from '@nativescript/core';
import { ApiService } from './api.service';

export class ImageCacheService extends Observable {
  private static _instance: ImageCacheService;
  private static localMap = new Map<string, string>();
  private static inProgress = new Set<string>();
  private static failedSet = new Set<string>();

  public static getInstance(): ImageCacheService {
    if (!ImageCacheService._instance) {
      ImageCacheService._instance = new ImageCacheService();
    }
    return ImageCacheService._instance;
  }

  private static getCacheFolder(): Folder {
    const tempDir = knownFolders.temp().path;
    const cachePath = path.join(tempDir, 'product_images');
    return Folder.fromPath(cachePath);
  }

  /**
   * Get cached local image path, or start downloading in background and return placeholder
   */
  public static getImagePath(remotePath: string | null | undefined): string {
    if (!remotePath || remotePath.trim() === '') {
      return '~/assets/logo.png';
    }

    // If already mapped to local file
    if (this.localMap.has(remotePath)) {
      return this.localMap.get(remotePath)!;
    }

    if (this.failedSet.has(remotePath)) {
      return '~/assets/logo.png';
    }

    const folder = this.getCacheFolder();
    const cleanFilename = remotePath.split('/').pop()?.split('?')[0] || 'img.jpg';
    const targetFilePath = path.join(folder.path, cleanFilename);

    if (File.exists(targetFilePath)) {
      const file = File.fromPath(targetFilePath);
      if (file.size > 200) {
        this.localMap.set(remotePath, targetFilePath);
        return targetFilePath;
      }
    }

    // Trigger download in background
    this.downloadImage(remotePath, targetFilePath);

    return '~/assets/logo.png';
  }

  /**
   * Download a single image with ngrok-skip-browser-warning header
   */
  public static async downloadImage(remotePath: string, destinationPath?: string): Promise<string> {
    if (this.inProgress.has(remotePath)) {
      return this.localMap.get(remotePath) || '~/assets/logo.png';
    }

    const folder = this.getCacheFolder();
    const cleanFilename = remotePath.split('/').pop()?.split('?')[0] || 'img.jpg';
    const targetFile = destinationPath || path.join(folder.path, cleanFilename);

    this.inProgress.add(remotePath);

    try {
      const fullUrl = ApiService.getImageUrl(remotePath);
      if (!fullUrl) {
        this.failedSet.add(remotePath);
        return '~/assets/logo.png';
      }

      await Http.getFile({
        url: fullUrl,
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': '69420'
        },
        timeout: 10000
      }, targetFile);

      if (File.exists(targetFile)) {
        const file = File.fromPath(targetFile);
        if (file.size > 200) {
          this.localMap.set(remotePath, targetFile);
          this.getInstance().notifyPropertyChange(remotePath, targetFile);
          return targetFile;
        }
      }
      this.failedSet.add(remotePath);
    } catch (e) {
      this.failedSet.add(remotePath);
    } finally {
      this.inProgress.delete(remotePath);
    }

    return '~/assets/logo.png';
  }

  /**
   * Preload a list of images in parallel batches
   */
  public static async preloadBatch(remotePaths: (string | null | undefined)[], onProgress?: () => void): Promise<void> {
    const validPaths = remotePaths.filter((p): p is string => !!p && !this.localMap.has(p) && !this.failedSet.has(p));
    const BATCH_SIZE = 6;

    for (let i = 0; i < validPaths.length; i += BATCH_SIZE) {
      const batch = validPaths.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(p => this.downloadImage(p)));
      if (onProgress) {
        onProgress();
      }
    }
  }
}
