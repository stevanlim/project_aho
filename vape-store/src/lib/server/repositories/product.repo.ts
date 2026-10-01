import pool from '../db/index.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { Product, ProductCategory } from '$lib/types/index.js';
import fs from 'fs';
import path from 'path';

export interface ProductQueryFilter {
  search?: string;
  category?: ProductCategory | 'all';
  status?: 'active' | 'inactive' | 'all';
  stockStatus?: 'all' | 'out' | 'low' | 'low_or_out';
  lowStockThreshold?: number;
  sortBy?: 'name' | 'stock' | 'selling_price' | 'created_at' | 'sku';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export const ProductRepo = {
  async getNextSku(category: ProductCategory): Promise<string> {
    const prefixes: Record<ProductCategory, string> = {
      device: 'DEV',
      liquid: 'LIQ',
      coil: 'COI',
      catridge: 'CAT',
      other: 'OTH'
    };
    const prefix = prefixes[category];

    // Ambil semua SKU dengan prefix ini untuk mencari angka tertinggi yang sebenarnya
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT sku FROM products WHERE sku LIKE ?`,
      [`${prefix}-%`]
    );

    let maxNumber = 0;
    for (const row of rows) {
      if (row.sku) {
        const match = (row.sku as string).match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    let nextNumber = maxNumber + 1;
    let candidate = `${prefix}-${String(nextNumber).padStart(4, '0')}`;

    // Verifikasi kepastian: pastikan kandidat SKU belum pernah dipakai
    while (true) {
      const [exists] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM products WHERE sku = ? LIMIT 1',
        [candidate]
      );
      if (exists.length === 0) {
        break;
      }
      nextNumber++;
      candidate = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    }

    return candidate;
  },

  async findById(id: number): Promise<Product | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );
    return (rows[0] as Product) || null;
  },

  async findBySku(sku: string): Promise<Product | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM products WHERE sku = ? LIMIT 1',
      [sku]
    );
    return (rows[0] as Product) || null;
  },

  async list(filter: ProductQueryFilter = {}): Promise<{ products: Product[]; total: number }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter.search && filter.search.trim() !== '') {
      conditions.push('(name LIKE ? OR sku LIKE ?)');
      params.push(`%${filter.search.trim()}%`, `%${filter.search.trim()}%`);
    }

    if (filter.category && filter.category !== 'all') {
      conditions.push('category = ?');
      params.push(filter.category);
    }

    if (filter.status && filter.status !== 'all') {
      conditions.push('status = ?');
      params.push(filter.status);
    }

    if (filter.stockStatus === 'out') {
      conditions.push('stock <= 0');
    } else if (filter.stockStatus === 'low') {
      const threshold = filter.lowStockThreshold || 5;
      conditions.push('stock > 0 AND stock <= ?');
      params.push(threshold);
    } else if (filter.stockStatus === 'low_or_out') {
      const threshold = filter.lowStockThreshold || 5;
      conditions.push('stock <= ?');
      params.push(threshold);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM products ${whereClause}`,
      params
    );
    const total = Number(countRows[0].count);

    // Sorting
    const allowedSortBy = ['name', 'stock', 'selling_price', 'created_at', 'sku'];
    const sortBy = allowedSortBy.includes(filter.sortBy || '') ? filter.sortBy! : 'created_at';
    const sortOrder = filter.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Pagination
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM products 
      ${whereClause} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;

    // MySQL execute requires limit and offset as numbers or strings
    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return {
      products: rows as Product[],
      total
    };
  },

  async getInventoryStats(filter: ProductQueryFilter = {}, threshold = 5): Promise<{
    totalCapital: number;
    totalRetailValue: number;
    totalEstimatedProfit: number;
    totalStockQty: number;
    activeProductsCount: number;
    outOfStockCount: number;
    lowStockCount: number;
  }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter.search && filter.search.trim() !== '') {
      conditions.push('(name LIKE ? OR sku LIKE ?)');
      params.push(`%${filter.search.trim()}%`, `%${filter.search.trim()}%`);
    }

    if (filter.category && filter.category !== 'all') {
      conditions.push('category = ?');
      params.push(filter.category);
    }

    if (filter.status && filter.status !== 'all') {
      conditions.push('status = ?');
      params.push(filter.status);
    }

    if (filter.stockStatus === 'out') {
      conditions.push('stock <= 0');
    } else if (filter.stockStatus === 'low') {
      conditions.push('stock > 0 AND stock <= ?');
      params.push(threshold);
    } else if (filter.stockStatus === 'low_or_out') {
      conditions.push('stock <= ?');
      params.push(threshold);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COALESCE(SUM(purchase_price * stock), 0) AS total_capital,
        COALESCE(SUM(selling_price * stock), 0) AS total_retail_value,
        COALESCE(SUM(stock), 0) AS total_stock_qty,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_products_count,
        COUNT(CASE WHEN stock <= 0 THEN 1 END) AS out_of_stock_count,
        COUNT(CASE WHEN stock > 0 AND stock <= ? THEN 1 END) AS low_stock_count
      FROM products
      ${whereClause}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [threshold, ...params]);
    const row = rows[0] || {};

    const totalCapital = Number(row.total_capital || 0);
    const totalRetailValue = Number(row.total_retail_value || 0);
    const totalStockQty = Number(row.total_stock_qty || 0);

    return {
      totalCapital,
      totalRetailValue,
      totalEstimatedProfit: Math.max(0, totalRetailValue - totalCapital),
      totalStockQty,
      activeProductsCount: Number(row.active_products_count || 0),
      outOfStockCount: Number(row.out_of_stock_count || 0),
      lowStockCount: Number(row.low_stock_count || 0)
    };
  },

  async getStockAlerts(options: {
    category?: ProductCategory | 'all' | string;
    stockStatus?: 'all' | 'out' | 'low' | string;
    search?: string;
    lowStockThreshold?: number;
  } = {}): Promise<{
    products: Product[];
    total: number;
    outOfStockCount: number;
    lowStockCount: number;
    categoryBreakdown: Record<string, { total: number; out: number; low: number }>;
  }> {
    const threshold = options.lowStockThreshold || 5;

    // 1. Get category breakdown & total alerts for all active products
    const [breakdownRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as out_count,
        SUM(CASE WHEN stock > 0 AND stock <= ? THEN 1 ELSE 0 END) as low_count
      FROM products
      WHERE status = 'active' AND stock <= ?
      GROUP BY category`,
      [threshold, threshold]
    );

    const categoryBreakdown: Record<string, { total: number; out: number; low: number }> = {
      device: { total: 0, out: 0, low: 0 },
      liquid: { total: 0, out: 0, low: 0 },
      coil: { total: 0, out: 0, low: 0 },
      catridge: { total: 0, out: 0, low: 0 },
      other: { total: 0, out: 0, low: 0 }
    };

    let totalOut = 0;
    let totalLow = 0;

    for (const row of breakdownRows) {
      const cat = row.category as string;
      const countTotal = Number(row.total || 0);
      const countOut = Number(row.out_count || 0);
      const countLow = Number(row.low_count || 0);

      categoryBreakdown[cat] = {
        total: countTotal,
        out: countOut,
        low: countLow
      };

      totalOut += countOut;
      totalLow += countLow;
    }

    // 2. Fetch the filtered products for alerts
    const conditions: string[] = ["status = 'active'"];
    const params: (string | number)[] = [];

    // Stock condition
    if (options.stockStatus === 'out') {
      conditions.push('stock <= 0');
    } else if (options.stockStatus === 'low') {
      conditions.push('stock > 0 AND stock <= ?');
      params.push(threshold);
    } else {
      // 'all' alerts (both low and out of stock)
      conditions.push('stock <= ?');
      params.push(threshold);
    }

    // Category filter
    if (options.category && options.category !== 'all') {
      conditions.push('category = ?');
      params.push(options.category);
    }

    // Search filter
    if (options.search && options.search.trim() !== '') {
      conditions.push('(name LIKE ? OR sku LIKE ?)');
      params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
    }

    const query = `
      SELECT * FROM products
      WHERE ${conditions.join(' AND ')}
      ORDER BY stock ASC, category ASC, name ASC
    `;

    const [productRows] = await pool.execute<RowDataPacket[]>(query, params);

    return {
      products: productRows as Product[],
      total: productRows.length,
      outOfStockCount: totalOut,
      lowStockCount: totalLow,
      categoryBreakdown
    };
  },

  async listActiveForPos(category?: string, search?: string): Promise<Product[]> {
    const conditions: string[] = ["status = 'active'"];
    const params: (string | number)[] = [];

    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search && search.trim() !== '') {
      conditions.push('(name LIKE ? OR sku LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const query = `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY name ASC`;
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows as Product[];
  },

  async create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO products (
        sku, category, name, description, photo, purchase_price, selling_price, 
        stock, unit, status, liquid_type, nicotine_mg, volume_ml, resistance_ohm
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sku,
        data.category,
        data.name,
        data.description || null,
        data.photo || null,
        data.purchase_price,
        data.selling_price,
        data.stock,
        data.unit || 'pcs',
        data.status || 'active',
        data.liquid_type || null,
        data.nicotine_mg || null,
        data.volume_ml || null,
        data.resistance_ohm || null
      ]
    );
    return result.insertId;
  },

  async update(id: number, data: Partial<Product>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'sku', 'category', 'name', 'description', 'photo', 'purchase_price', 'selling_price',
      'stock', 'unit', 'status', 'liquid_type', 'nicotine_mg', 'volume_ml', 'resistance_ohm'
    ];

    for (const key of allowedFields) {
      if (key in data) {
        fields.push(`${key} = ?`);
        params.push((data as Record<string, unknown>)[key] ?? null);
      }
    }

    if (fields.length === 0) return;

    params.push(id);
    await pool.execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  },

  async isUsedInSales(productId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ? LIMIT 1',
      [productId]
    );
    return Number(rows[0].count) > 0;
  },

  async softDelete(id: number): Promise<void> {
    await pool.execute("UPDATE products SET status = 'inactive' WHERE id = ?", [id]);
  },

  async hardDelete(id: number): Promise<void> {
    const prod = await this.findById(id);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM stock_mutations WHERE product_id = ?', [id]);
      await conn.execute('DELETE FROM products WHERE id = ?', [id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // Clean up uploaded photo file if present
    if (prod?.photo && prod.photo.startsWith('/uploads/products/')) {
      try {
        const filePath = path.resolve('static', prod.photo.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (e) {
        console.error('Failed to unlink product photo file:', e);
      }
    }
  }
};
