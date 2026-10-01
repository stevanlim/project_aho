import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';
import { StockRepo } from '$lib/server/repositories/stock.repo.js';
import pool from '$lib/server/db/index.js';

export const load: PageServerLoad = async () => {
  const products = await ProductRepo.listActiveForPos();
  return {
    products
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const productId = Number(formData.get('product_id'));
    const quantity = parseInt(formData.get('quantity')?.toString() || '0', 10);
    const purchasePrice = parseFloat(formData.get('purchase_price')?.toString() || '0');
    const note = formData.get('note')?.toString()?.trim() || '';

    if (!productId) {
      return fail(400, { error: 'Silakan pilih produk yang akan ditambahkan stoknya.' });
    }

    if (quantity === 0 || isNaN(quantity)) {
      return fail(400, { error: 'Jumlah barang masuk atau koreksi stok tidak boleh 0.' });
    }

    if (purchasePrice < 0) {
      return fail(400, { error: 'Harga modal tidak boleh bernilai negatif.' });
    }

    try {
      const product = await ProductRepo.findById(productId);
      if (!product) {
        return fail(404, { error: 'Produk tidak ditemukan.' });
      }

      if (quantity < 0 && (Number(product.stock) + quantity) < 0) {
        return fail(400, {
          error: `Jumlah pengurangan (-${Math.abs(quantity)}) melebihi stok yang ada saat ini (${product.stock} ${product.unit}).`
        });
      }

      await StockRepo.addStockIn(
        productId,
        quantity,
        purchasePrice,
        note || (quantity < 0 ? 'Koreksi kelebihan stok' : 'Barang masuk inventori'),
        locals.user?.username || 'admin_vape'
      );

      // Audit log & return message
      if (quantity > 0) {
        await pool.execute(
          `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
          [
            'STOCK_IN',
            `Pemasukan stok: +${quantity} ${product.unit} untuk ${product.name} (Modal: Rp ${purchasePrice.toLocaleString()})`,
            locals.user?.username || 'admin_vape'
          ]
        );

        return {
          success: true,
          message: `Stok berhasil ditambahkan: +${quantity} ${product.unit} untuk ${product.name}.`
        };
      } else {
        await pool.execute(
          `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
          [
            'STOCK_ADJUSTMENT',
            `Koreksi pengurangan stok (kelebihan input): ${quantity} ${product.unit} untuk ${product.name}`,
            locals.user?.username || 'admin_vape'
          ]
        );

        return {
          success: true,
          message: `Koreksi stok berhasil disimpan: ${quantity} ${product.unit} untuk ${product.name} (Sisa stok sekarang: ${Number(product.stock) + quantity} ${product.unit}).`
        };
      }
    } catch (err: any) {
      console.error('Stock in/adjustment error:', err);
      return fail(500, {
        error: err?.message || 'Terjadi kegagalan saat menyimpan transaksi barang masuk.'
      });
    }
  }
};
