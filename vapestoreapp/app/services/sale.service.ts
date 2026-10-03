import { ApiService } from './api.service';
import { Sale } from '../models/sale.model';

export class SaleService {
  /**
   * Get sales list with filters & pagination
   */
  public static async getSales(filters?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sales: Sale[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') params.set('paymentMethod', filters.paymentMethod);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    try {
      const result = await ApiService.get(`/api/sales${query ? '?' + query : ''}`);
      if (result && Array.isArray(result.sales)) return result;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData(`/transactions${query ? '?' + query : ''}`);
    if (data && Array.isArray(data.sales)) {
      return {
        sales: data.sales,
        total: data.total || data.sales.length
      };
    }
    return { sales: [], total: 0 };
  }

  /**
   * Get sale detail by ID
   */
  public static async getSaleById(id: number): Promise<Sale> {
    return ApiService.get(`/api/sales/${id}`);
  }

  /**
   * Delete/void a sale (returns stock)
   */
  public static async deleteSale(id: number): Promise<{ success: boolean; message: string }> {
    return ApiService.delete(`/api/sales/${id}`);
  }
}
