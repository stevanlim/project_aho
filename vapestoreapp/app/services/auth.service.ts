import { ApplicationSettings, Http, HttpResponse } from '@nativescript/core';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

export class AuthService {
  /**
   * Step 1: Verify username + password
   */
  public static async loginStep1(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Prioritize clean JSON REST API
      try {
        const apiUrl = `${ApiService.BASE_URL}/api/auth/login`;
        const apiResponse: HttpResponse = await Http.request({
          url: apiUrl,
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': '69420',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          content: JSON.stringify({ username, password }),
          timeout: 15000
        });

        if (apiResponse.statusCode === 200) {
          const json = apiResponse.content?.toJSON();
          if (json && json.success) {
            const rawCookies = apiResponse.headers?.['Set-Cookie'] || apiResponse.headers?.['set-cookie'] || '';
            const cookieStr = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies || '');
            const pendingMatch = cookieStr.match(/ss_vape_pending=([^;]+)/);
            if (pendingMatch) {
              ApplicationSettings.setString('pending_cookies', `ss_vape_pending=${pendingMatch[1]}`);
            } else if (json.userId) {
              ApplicationSettings.setString('pending_cookies', `ss_vape_pending=${json.userId}`);
            }
            if (json.userId) {
              ApplicationSettings.setString('pending_user_id', String(json.userId));
            }
            return { success: true };
          }
        } else if (apiResponse.statusCode === 400) {
          const json = apiResponse.content?.toJSON();
          return { success: false, error: json?.error || 'Username atau password salah.' };
        }
      } catch (err) {
        console.warn('Direct /api/auth/login failed, attempting web form fallback...', err);
      }

      // 2. Fallback to web form action /login
      const url = `${ApiService.BASE_URL}/login`;
      const response: HttpResponse = await Http.request({
        url,
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/json'
        },
        content: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        timeout: 15000
      });

      const statusCode = response.statusCode;
      const location = (response.headers?.['location'] as string) || (response.headers?.['Location'] as string) || '';
      const responseUrl = (response as any).url || location || '';
      const responseText = response.content?.toString() || '';

      const isSuccess = (statusCode === 200 || statusCode === 303) && (
        responseUrl.includes('/login/pin') ||
        responseText.includes('/login/pin') ||
        responseText.includes('"redirect"')
      );

      // Check for redirect to pin page (success)
      if (isSuccess) {
        const cookies = response.headers?.['Set-Cookie'] || response.headers?.['set-cookie'] || '';
        if (cookies) {
          const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
          const pendingMatch = cookieStr.match(/ss_vape_pending=([^;]+)/);
          if (pendingMatch) {
            ApplicationSettings.setString('pending_cookies', `ss_vape_pending=${pendingMatch[1]}`);
          } else {
            ApplicationSettings.setString('pending_cookies', cookieStr.split(';')[0]);
          }
        }
        return { success: true };
      }

      // If still on login page, extract error
      if (responseText.includes('salah') || responseText.includes('error') || responseText.includes('wajib')) {
        return { success: false, error: 'Username atau password salah.' };
      }

      if (statusCode === 400) {
        return { success: false, error: 'Username atau password salah.' };
      }

      return { success: false, error: 'Login gagal. Periksa koneksi server.' };
    } catch (err: any) {
      console.error('Login Step 1 error:', err);
      return { success: false, error: 'Koneksi ke server gagal. Pastikan server aktif.' };
    }
  }

  /**
   * Step 2: Verify PIN
   */
  public static async loginStep2(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pendingCookies = ApplicationSettings.getString('pending_cookies', '');
      const pendingUserId = ApplicationSettings.getString('pending_user_id', '');

      // 1. Prioritize clean JSON REST API
      try {
        const apiUrl = `${ApiService.BASE_URL}/api/auth/pin`;
        const apiHeaders: Record<string, string> = {
          'ngrok-skip-browser-warning': '69420',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        if (pendingCookies) {
          apiHeaders['Cookie'] = pendingCookies;
        }

        const apiResponse: HttpResponse = await Http.request({
          url: apiUrl,
          method: 'POST',
          headers: apiHeaders,
          content: JSON.stringify({ pin, userId: pendingUserId ? Number(pendingUserId) : undefined }),
          timeout: 15000
        });

        if (apiResponse.statusCode === 200) {
          const json = apiResponse.content?.toJSON();
          if (json && json.success) {
            if (json.token) {
              ApplicationSettings.setString('auth_token', json.token);
            }
            if (json.user) {
              this.setCurrentUser(json.user);
            } else {
              await this.fetchAndStoreUser();
            }
            ApplicationSettings.remove('pending_cookies');
            ApplicationSettings.remove('pending_user_id');
            return { success: true };
          }
        } else if (apiResponse.statusCode === 400) {
          const json = apiResponse.content?.toJSON();
          return { success: false, error: json?.error || 'PIN yang dimasukkan salah.' };
        }
      } catch (err) {
        console.warn('Direct /api/auth/pin failed, attempting web form fallback...', err);
      }

      // 2. Fallback to web form action /login/pin
      const url = `${ApiService.BASE_URL}/login/pin`;
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': '69420',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/json'
      };

      if (pendingCookies) {
        headers['Cookie'] = pendingCookies;
      }

      const response: HttpResponse = await Http.request({
        url,
        method: 'POST',
        headers,
        content: `pin=${encodeURIComponent(pin)}`,
        timeout: 15000
      });

      const statusCode = response.statusCode;
      const location = (response.headers?.['location'] as string) || (response.headers?.['Location'] as string) || '';
      const responseUrl = (response as any).url || location || '';
      const responseText = response.content?.toString() || '';

      const cookies = response.headers?.['Set-Cookie'] || response.headers?.['set-cookie'] || '';
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : String(cookies);
      const sessionMatch = cookieStr.match(/ss_vape_session=([^;]+)/);

      const isSuccess = (statusCode === 200 || statusCode === 303) && (
        responseUrl.includes('/dashboard') ||
        responseUrl.includes('/pos') ||
        responseText.includes('/dashboard') ||
        responseText.includes('/pos') ||
        responseText.includes('"redirect"') ||
        sessionMatch !== null
      );

      if (isSuccess) {
        if (sessionMatch) {
          ApplicationSettings.setString('auth_token', sessionMatch[1]);
        }

        await this.fetchAndStoreUser();
        ApplicationSettings.remove('pending_cookies');
        ApplicationSettings.remove('pending_user_id');
        return { success: true };
      }

      if (responseText.includes('salah') || responseText.includes('error') || responseText.includes('failure')) {
        return { success: false, error: 'PIN yang dimasukkan salah.' };
      }

      if (statusCode === 400) {
        return { success: false, error: 'PIN yang dimasukkan salah.' };
      }

      return { success: false, error: 'Verifikasi PIN gagal.' };
    } catch (err: any) {
      console.error('Login Step 2 error:', err);
      return { success: false, error: 'Koneksi ke server gagal.' };
    }
  }

  /**
   * Fetch current user data and store locally
   */
  public static async fetchAndStoreUser(): Promise<User | null> {
    try {
      const token = ApplicationSettings.getString('auth_token', '');
      if (!token) return null;

      const stored = ApplicationSettings.getString('user_data', '');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Logout and clear session
   */
  public static async logout(): Promise<void> {
    try {
      const token = ApplicationSettings.getString('auth_token', '');
      await Http.request({
        url: `${ApiService.BASE_URL}/logout`,
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          'Cookie': `ss_vape_session=${token}`
        },
        timeout: 10000
      });
    } catch {
      // Ignore errors on logout
    } finally {
      ApplicationSettings.remove('auth_token');
      ApplicationSettings.remove('user_data');
      ApplicationSettings.remove('pending_cookies');
      ApplicationSettings.remove('pending_user_id');
    }
  }

  /**
   * Check if user is logged in
   */
  public static isLoggedIn(): boolean {
    return !!ApplicationSettings.getString('auth_token', '');
  }

  /**
   * Get current user data
   */
  public static getCurrentUser(): User | null {
    const stored = ApplicationSettings.getString('user_data', '');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Store user data
   */
  public static setCurrentUser(user: User): void {
    ApplicationSettings.setString('user_data', JSON.stringify(user));
  }
}
