export type ProductCategory = 'device' | 'liquid' | 'coil' | 'catridge' | 'other';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string;
  category: ProductCategory;
  name: string;
  description: string | null;
  photo: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  min_stock?: number | null;
  unit: string;
  status: 'active' | 'inactive';
  liquid_type?: 'Saltnic' | 'Freebase' | null;
  nicotine_mg?: number | null;
  volume_ml?: number | null;
  resistance_ohm?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMutation {
  id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  product_category?: ProductCategory;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  purchase_price: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer' | 'Other';

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  subtotal: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  status: 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  items?: SaleItem[];
}

export interface Settings {
  id: number;
  store_name: string;
  address: string | null;
  phone: string | null;
  invoice_footer: string;
  low_stock_threshold: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
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
