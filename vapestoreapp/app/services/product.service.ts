import { ApiService } from './api.service';
import { Product, ProductFilters } from '../models/product.model';

export class ProductService {
  /**
   * Get list of products with filters & pagination
   */
  public static async getProducts(filters?: ProductFilters): Promise<{ products: Product[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.stockStatus && filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    try {
      const endpoint = `/api/products${query ? '?' + query : ''}`;
      const result = await ApiService.get(endpoint);
      if (result && Array.isArray(result.products)) return result;
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData(`/products${query ? '?' + query : ''}`);
    if (data && Array.isArray(data.products)) {
      return {
        products: data.products,
        total: data.total || data.products.length
      };
    }
    return { products: [], total: 0 };
  }

  /**
   * Get active products for POS
   */
  public static async getActiveProducts(): Promise<Product[]> {
    try {
      const result = await ApiService.get<{ products: Product[] }>('/api/pos/products');
      if (result && Array.isArray(result.products) && result.products.length > 0) {
        return result.products;
      }
    } catch {
      // Fallback
    }

    const data = await ApiService.fetchSvelteKitData('/pos');
    if (data && Array.isArray(data.products)) {
      return data.products;
    }
    return [];
  }

  /**
   * Get product detail by ID
   */
  public static async getProductById(id: number): Promise<Product> {
    try {
      const prod = await ApiService.get(`/api/products/${id}`);
      if (prod && prod.id) return prod;
    } catch {
      // Fallback
    }

    const list = await this.getActiveProducts();
    const found = list.find(p => p.id === id);
    if (found) return found;
    throw new Error('Produk tidak ditemukan');
  }

  /**
   * Create new product
   */
  public static async createProduct(data: Partial<Product>): Promise<any> {
    return ApiService.post('/api/products', data);
  }

  /**
   * Update existing product
   */
  public static async updateProduct(id: number, data: Partial<Product>): Promise<any> {
    return ApiService.put(`/api/products/${id}`, data);
  }

  /**
   * Delete product
   */
  public static async deleteProduct(id: number): Promise<any> {
    return ApiService.delete(`/api/products/${id}`);
  }

  /**
   * Upload product photo
   */
  public static async uploadPhoto(filePath: string): Promise<{ url: string }> {
    // For NativeScript, we'd use background Http to upload multipart form data
    // This is a simplified version
    return ApiService.request({
      endpoint: '/api/upload',
      method: 'POST',
      body: filePath,
      isFormData: true
    });
  }
}
