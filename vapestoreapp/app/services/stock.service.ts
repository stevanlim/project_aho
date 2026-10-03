import { ApiService } from './api.service';
import { StockMutation, StockAlert } from '../models/stock.model';

export class StockService {
  /**
   * Add stock in / adjustment
   */
  public static async addStockIn(data: {
    productId: number;
    quantity: number;
    purchasePrice: number;
    note?: string;
  }): Promise<any> {
    return ApiService.post('/api/stock/in', data);
  }

  /**
   * Get stock mutations list
   */
  public static async getMutations(filters?: {
    search?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
  }): Promise<{ mutations: StockMutation[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.page) params.set('page', String(filters.page));

    const query = params.toString();
    try {
      const result = await ApiService.get(`/api/stock/mutations${query ? '?' + query : ''}`);
      if (result && Array.isArray(result.mutations)) return result;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData(`/stock/mutations${query ? '?' + query : ''}`);
    if (data && Array.isArray(data.mutations)) {
      return {
        mutations: data.mutations,
        total: data.total || data.mutations.length
      };
    }
    return { mutations: [], total: 0 };
  }

  /**
   * Get low stock alerts
   */
  public static async getAlerts(): Promise<StockAlert[]> {
    try {
      const result = await ApiService.get<{ alerts: StockAlert[] }>('/api/stock/alerts');
      if (result && Array.isArray(result.alerts)) return result.alerts;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData('/stock/alerts');
    if (data && Array.isArray(data.products)) {
      return data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        stock: p.stock,
        min_stock: 5,
        unit: p.unit || 'pcs',
        status: p.stock === 0 ? 'out' : 'low'
      }));
    }
    return [];
  }
}
