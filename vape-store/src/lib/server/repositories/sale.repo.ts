import pool from '../db/index.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { Sale, SaleItem, PaymentMethod } from '$lib/types/index.js';

export interface CheckoutItemInput {
  productId: number;
  quantity: number;
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  discount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  createdBy?: string;
}

export interface SaleFilter {
  search?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export const SaleRepo = {
  async generateInvoiceNumber(connection: any): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `INV-${year}${month}${day}`;

    const [rows] = await connection.query(
      `SELECT invoice_number FROM sales 
       WHERE invoice_number LIKE ? 
       ORDER BY id DESC LIMIT 1 FOR UPDATE`,
      [`${datePrefix}-%`]
    );

    let sequence = 1;
    if (rows.length > 0 && rows[0].invoice_number) {
      const match = rows[0].invoice_number.match(/-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${datePrefix}-${String(sequence).padStart(4, '0')}`;
  },

  async processCheckout(input: CheckoutInput): Promise<{ saleId: number; invoiceNumber: string }> {
    if (!input.items || input.items.length === 0) {
      throw new Error('Keranjang belanja tidak boleh kosong.');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const invoiceNumber = await this.generateInvoiceNumber(connection);
      let calculatedSubtotal = 0;
      const verifiedItems: {
        productId: number;
        productName: string;
        quantity: number;
        unitPrice: number;
        purchasePrice: number;
        subtotal: number;
      }[] = [];

      // 1. Validate items & check stock with row locks
      for (const item of input.items) {
        if (item.quantity <= 0) {
          throw new Error('Jumlah item harus lebih dari 0.');
        }

        const [products] = await connection.query<RowDataPacket[]>(
          'SELECT id, name, stock, purchase_price, selling_price, status FROM products WHERE id = ? FOR UPDATE',
          [item.productId]
        );

        if (products.length === 0) {
          throw new Error(`Produk dengan ID #${item.productId} tidak ditemukan.`);
        }

        const product = products[0];
        if (product.status !== 'active') {
          throw new Error(`Produk "${product.name}" sedang nonaktif.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk produk "${product.name}". Stok tersedia: ${product.stock}, diminta: ${item.quantity}.`);
        }

        const unitPrice = Number(product.selling_price);
        const purchasePrice = Number(product.purchase_price);
        const itemSubtotal = unitPrice * item.quantity;
        calculatedSubtotal += itemSubtotal;

        verifiedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          purchasePrice,
          subtotal: itemSubtotal
        });
      }

      const discount = Math.max(0, Number(input.discount) || 0);
      const grandTotal = Math.max(0, calculatedSubtotal - discount);
      const paidAmount = Number(input.paidAmount) || 0;

      if (paidAmount < grandTotal) {
        throw new Error(`Jumlah bayar (Rp ${paidAmount.toLocaleString()}) kurang dari total tagihan (Rp ${grandTotal.toLocaleString()}).`);
      }

      const changeAmount = paidAmount - grandTotal;
      const createdBy = input.createdBy || 'admin_vape';

      // 2. Insert into sales table
      const [saleResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO sales (
          invoice_number, subtotal, discount, grand_total, paid_amount, change_amount, 
          payment_method, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, NOW())`,
        [
          invoiceNumber,
          calculatedSubtotal,
          discount,
          grandTotal,
          paidAmount,
          changeAmount,
          input.paymentMethod,
          createdBy
        ]
      );

      const saleId = saleResult.insertId;

      // 3. Process each item: insert sale_item, deduct stock, record mutation OUT
      for (const vItem of verifiedItems) {
        await connection.execute(
          `INSERT INTO sale_items (
            sale_id, product_id, product_name, quantity, unit_price, purchase_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            saleId,
            vItem.productId,
            vItem.productName,
            vItem.quantity,
            vItem.unitPrice,
            vItem.purchasePrice,
            vItem.subtotal
          ]
        );

        // Deduct stock
        await connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [vItem.quantity, vItem.productId]
        );

        // Record stock mutation OUT
        await connection.execute(
          `INSERT INTO stock_mutations (
            product_id, type, quantity, purchase_price, reference_type, reference_id, note, created_by, created_at
          ) VALUES (?, 'OUT', ?, ?, 'sale', ?, 'Penjualan Kasir POS', ?, NOW())`,
          [
            vItem.productId,
            vItem.quantity,
            vItem.purchasePrice,
            invoiceNumber,
            createdBy
          ]
        );
      }

      // 4. Record audit log
      await connection.execute(
        `INSERT INTO audit_logs (action, details, created_by, created_at) VALUES (?, ?, ?, NOW())`,
        [
          'SALE_CHECKOUT',
          `Transaksi selesai: ${invoiceNumber}, Total: ${grandTotal}, Metode: ${input.paymentMethod}`,
          createdBy
        ]
      );

      await connection.commit();
      return { saleId, invoiceNumber };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findById(id: number): Promise<Sale | null> {
    const [sales] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sales WHERE id = ? LIMIT 1',
      [id]
    );
    if (sales.length === 0) return null;

    const sale = sales[0] as Sale;

    const [items] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC',
      [id]
    );
    sale.items = items as SaleItem[];

    return sale;
  },

  async findByInvoice(invoiceNumber: string): Promise<Sale | null> {
    const [sales] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sales WHERE invoice_number = ? LIMIT 1',
      [invoiceNumber]
    );
    if (sales.length === 0) return null;

    const sale = sales[0] as Sale;
    const [items] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC',
      [sale.id]
    );
    sale.items = items as SaleItem[];

    return sale;
  },

  async list(filter: SaleFilter = {}): Promise<{ sales: (Sale & { item_count: number })[]; total: number }> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter.search && filter.search.trim() !== '') {
      conditions.push('s.invoice_number LIKE ?');
      params.push(`%${filter.search.trim()}%`);
    }

    if (filter.startDate) {
      conditions.push('s.created_at >= ?');
      params.push(`${filter.startDate} 00:00:00`);
    }

    if (filter.endDate) {
      conditions.push('s.created_at <= ?');
      params.push(`${filter.endDate} 23:59:59`);
    }

    if (filter.paymentMethod && filter.paymentMethod !== 'all') {
      conditions.push('s.payment_method = ?');
      params.push(filter.paymentMethod);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM sales s ${whereClause}`,
      params
    );
    const total = Number(countRows[0].count);

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      ${whereClause}
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [...params, limit, offset]);

    return {
      sales: rows as (Sale & { item_count: number })[],
      total
    };
  }
};
