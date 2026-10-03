export type ProductCategory = 'device' | 'liquid' | 'coil' | 'catridge' | 'other';

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
  unit: string;
  status: 'active' | 'inactive';
  liquid_type?: 'Saltnic' | 'Freebase' | null;
  nicotine_mg?: number | null;
  volume_ml?: number | null;
  resistance_ohm?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  category?: ProductCategory | 'all';
  status?: 'active' | 'inactive' | 'all';
  stockStatus?: 'all' | 'low' | 'out';
  page?: number;
  limit?: number;
}
