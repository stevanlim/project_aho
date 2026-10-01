import pool from '../db/index.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { StockMutation } from '$lib/types/index.js';

export interface MutationFilter {
  productId?: number;
  type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'all';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const StockRepo = {
  async addStockIn(
    productId: number,
    quantity: number,
    purchasePrice: number,
    note: string,
    createdBy = 'admin_vape'
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Cek stok saat ini dengan kunci baris (FOR UPDATE)
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      if (rows.length === 0) throw new Error('Produk tidak ditemukan');

      const currentStock = Number(rows[0].stock) || 0;
      const newStock = currentStock + quantity;

      if (newStock < 0) {
        throw new Error(
          `Stok tidak mencukupi untuk dikurangi. Stok saat ini: ${currentStock}, pengurangan: ${Math.abs(quantity)}.`
        );
      }

      if (quantity >= 0) {
        // Pemasukan stok normal
        await connection.execute(
          `UPDATE products 
           SET stock = ?, purchase_price = ? 
           WHERE id = ?`,
          [newStock, purchasePrice, productId]
        );

        // Insert stock mutation sebagai 'IN'
        await connection.execute(
          `INSERT INTO stock_mutations (
            product_id, type, quantity, purchase_price, reference_type, reference_id, note, created_by
          ) VALUES (?, 'IN', ?, ?, 'stock_in', NULL, ?, ?)`,
          [productId, quantity, purchasePrice, note || 'Pemasukan stok barang baru', createdBy]
        );
      } else {
        // Koreksi pengurangan stok (mines karena salah / kelebihan input sebelumnya)
        await connection.execute(
          `UPDATE products 
           SET stock = ? 
           WHERE id = ?`,
          [newStock, productId]
        );

        // Insert stock mutation sebagai 'ADJUSTMENT' dengan quantity bernilai minus
        await connection.execute(
          `INSERT INTO stock_mutations (
            product_id, type, quantity, purchase_price, reference_type, reference_id, note, created_by
          ) VALUES (?, 'ADJUSTMENT', ?, ?, 'stock_correction', 'CORRECTION', ?, ?)`,
          [productId, quantity, purchasePrice, note || 'Koreksi pengurangan stok (kelebihan input)', createdBy]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async addAdjustment(
    productId: number,
    newStock: number,
    note: string,
    createdBy = 'admin_vape'
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT stock, purchase_price FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      if (rows.length === 0) throw new Error('Produk tidak ditemukan');

      const currentStock = Number(rows[0].stock);
      const purchasePrice = Number(rows[0].purchase_price);
      const diff = newStock - currentStock;

      if (diff === 0) {
        await connection.rollback();
        return;
      }

      await connection.execute(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, productId]
      );

      await connection.execute(
        `INSERT INTO stock_mutations (
          product_id, type, quantity, purchase_price, reference_type, reference_id, note, created_by
        ) VALUES (?, 'ADJUSTMENT', ?, ?, 'adjustment', NULL, ?, ?)`,
        [productId, diff, purchasePrice, note || 'Penyesuaian stok manual', createdBy]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async listMutations(filter: MutationFilter = {}): Promise<{ mutations: StockMutation[]; total: number }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter.productId) {
      conditions.push('m.product_id = ?');
      params.push(filter.productId);
    }

    if (filter.type && filter.type !== 'all') {
      conditions.push('m.type = ?');
      params.push(filter.type);
    }

    if (filter.startDate) {
      conditions.push('m.created_at >= ?');
      params.push(`${filter.startDate} 00:00:00`);
    }

    if (filter.endDate) {
      conditions.push('m.created_at <= ?');
      params.push(`${filter.endDate} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM stock_mutations m ${whereClause}`,
      params
    );
    const total = Number(countRows[0].count);

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 25));
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        m.*,
        p.name as product_name,
        p.sku as product_sku,
        p.category as product_category
      FROM stock_mutations m
      JOIN products p ON m.product_id = p.id
      ${whereClause}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return {
      mutations: rows as StockMutation[],
      total
    };
  }
};
