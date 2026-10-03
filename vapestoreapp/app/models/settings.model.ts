export interface Settings {
  id: number;
  store_name: string;
  address: string | null;
  phone: string | null;
  invoice_footer: string;
  low_stock_threshold: number;
}

export interface DashboardStats {
  todaySalesCount: number;
  todayRevenue: number;
  monthSalesCount: number;
  monthRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ReportSummary {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  salesCount: number;
}
