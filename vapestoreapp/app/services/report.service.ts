import { ApiService } from './api.service';
import { DashboardStats, ReportSummary, Settings } from '../models/settings.model';

export class ReportService {
  /**
   * Get dashboard statistics
   */
  public static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const stats = await ApiService.get('/api/dashboard/stats');
      if (stats && typeof stats.todaySalesCount === 'number') return stats;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData('/dashboard');
    if (data && data.stats) {
      return data.stats;
    }
    return {
      todaySalesCount: 0,
      todayRevenue: 0,
      monthSalesCount: 0,
      monthRevenue: 0,
      totalProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };
  }

  /**
   * Get financial report with payment breakdown (cash, qris, transfer)
   */
  public static async getFinancialReport(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.period) q.set('period', params.period);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const query = q.toString();
    try {
      const res = await ApiService.get(`/api/reports/summary${query ? '?' + query : ''}`);
      if (res && res.paymentBreakdown) return res;
    } catch (e) {
      console.warn('ReportService.getFinancialReport fallback:', e);
    }
    return null;
  }

  /**
   * Get report summary
   */
  public static async getReportSummary(period: string = 'today'): Promise<ReportSummary> {
    try {
      const res = await ApiService.get(`/api/reports/summary?period=${period}`);
      if (res && res.revenueSummary) return res;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData(`/reports?period=${period}`);
    return data?.report || {
      revenueSummary: { totalRevenue: 0, totalSales: 0, averageTransaction: 0 },
      paymentBreakdown: [],
      dailyTrends: [],
      profitSummary: { totalProfit: 0, marginPercentage: 0 }
    };
  }

  /**
   * Get store settings
   */
  public static async getSettings(): Promise<Settings> {
    try {
      const res = await ApiService.get('/api/settings');
      if (res && res.store_name) return res;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData('/settings');
    return data?.settings || {
      store_name: 'SS VAPE',
      address: '',
      phone: '',
      invoice_footer: 'Terima kasih telah berbelanja di SS VAPE',
      low_stock_threshold: 5
    };
  }

  /**
   * Update store settings
   */
  public static async updateSettings(data: Partial<Settings>): Promise<any> {
    return ApiService.put('/api/settings', data);
  }
}
