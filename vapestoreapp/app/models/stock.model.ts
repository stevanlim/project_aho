import { ProductCategory } from './product.model';

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

export interface StockMutationListResponse {
  mutations: StockMutation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StockAlert {
  id: number;
  name: string;
  sku: string;
  category: ProductCategory;
  stock: number;
  unit: string;
  photo: string | null;
}
