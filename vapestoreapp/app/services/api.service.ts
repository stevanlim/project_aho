import { Http, HttpRequestOptions, HttpResponse, ApplicationSettings } from '@nativescript/core';
import { unflatten } from 'devalue';

export class ApiService {
  public static BASE_URL = 'https://bandannaed-tensibly-renda.ngrok-free.dev';

  /**
   * Generic HTTP request method with ngrok header and auth token
   */
  public static async request<T = any>(options: {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    isFormData?: boolean;
  }): Promise<T> {
    const token = ApplicationSettings.getString('auth_token', '');
    const url = `${this.BASE_URL}${options.endpoint}`;

    const headers: Record<string, string> = {
      // WAJIB: Bypass ngrok free browser warning page
      'ngrok-skip-browser-warning': '69420',
      'Accept': 'application/json'
    };

    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Cookie'] = `ss_vape_session=${token}`;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: HttpRequestOptions = {
      url,
      method: options.method || 'GET',
      headers,
      timeout: 20000
    };

    if (options.body) {
      if (options.isFormData) {
        requestOptions.content = options.body;
      } else {
        requestOptions.content = JSON.stringify(options.body);
      }
    }

    try {
      const response: HttpResponse = await Http.request(requestOptions);
      const statusCode = response.statusCode;

      if (statusCode === 401) {
        ApplicationSettings.remove('auth_token');
        ApplicationSettings.remove('user_data');
        throw new Error('SESSION_EXPIRED');
      }

      let result: any;
      try {
        result = response.content?.toJSON();
      } catch {
        const text = response.content?.toString() || '';
        // If ngrok returned HTML warning page instead of JSON
        if (text.includes('ngrok') || text.includes('<!DOCTYPE')) {
          throw new Error('Ngrok tunnel tidak aktif atau header bypass tidak terkirim.');
        }
        throw new Error(`Response bukan JSON. Status: ${statusCode}`);
      }

      if (statusCode < 200 || statusCode >= 300) {
        const msg = result?.error || result?.message || `Request gagal (${statusCode})`;
        throw new Error(msg);
      }

      return result as T;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') throw err;
      if (err.message?.includes('Ngrok')) throw err;
      if (err.message?.includes('Request gagal')) throw err;
      // Network error
      console.error('ApiService request error:', err);
      throw new Error('Koneksi ke server gagal. Pastikan server dan ngrok tunnel aktif.');
    }
  }

  /**
   * GET request shorthand
   */
  public static get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>({ endpoint, method: 'GET' });
  }

  /**
   * POST request shorthand
   */
  public static post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>({ endpoint, method: 'POST', body });
  }

  /**
   * PUT request shorthand
   */
  public static put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>({ endpoint, method: 'PUT', body });
  }

  /**
   * DELETE request shorthand
   */
  public static delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>({ endpoint, method: 'DELETE' });
  }

  /**
   * Get full image URL from a relative path
   */
  public static getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  }

  /**
   * Fetch and deserialize SvelteKit page data from __data.json
   */
  public static async fetchSvelteKitData(route: string): Promise<any> {
    const token = ApplicationSettings.getString('auth_token', '');
    const cleanRoute = route.split('?')[0].replace(/\/$/, '');
    const query = route.includes('?') ? '?' + route.split('?')[1] : '';
    const url = `${this.BASE_URL}${cleanRoute}/__data.json${query}`;

    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': '69420',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Cookie'] = `ss_vape_session=${token}`;
    }

    try {
      const response: HttpResponse = await Http.request({
        url,
        method: 'GET',
        headers,
        timeout: 20000
      });

      if (response.statusCode === 401) {
        ApplicationSettings.remove('auth_token');
        ApplicationSettings.remove('user_data');
        throw new Error('SESSION_EXPIRED');
      }

      const json = response.content?.toJSON();
      if (!json || !json.nodes) return null;

      const merged: Record<string, any> = {};
      for (const node of json.nodes) {
        if (node && node.data) {
          try {
            const dataObj = unflatten(node.data);
            Object.assign(merged, dataObj);
          } catch (e) {
            console.error('unflatten error:', e);
          }
        }
      }
      return merged;
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') throw err;
      console.error(`fetchSvelteKitData error for ${route}:`, err);
      return null;
    }
  }
}
