import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';
import pool from '$lib/server/db/index.js';
import type { ProductCategory } from '$lib/types/index.js';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();

    const category = formData.get('category')?.toString() as ProductCategory;
    const name = formData.get('name')?.toString()?.trim() || '';
    const description = formData.get('description')?.toString()?.trim() || null;
    const photo = formData.get('photo')?.toString()?.trim() || null;
    const purchasePrice = parseFloat(formData.get('purchase_price')?.toString() || '0');
    const sellingPrice = parseFloat(formData.get('selling_price')?.toString() || '0');
    const stock = parseInt(formData.get('stock')?.toString() || '0', 10);
    const unit = formData.get('unit')?.toString()?.trim() || 'pcs';
    const status = (formData.get('status')?.toString() as any) || 'active';

    // Specific fields
    const liquidType = (formData.get('liquid_type')?.toString() as any) || null;
    const nicotineMg = formData.get('nicotine_mg') ? parseInt(formData.get('nicotine_mg')!.toString(), 10) : null;
    const volumeMl = formData.get('volume_ml') ? parseInt(formData.get('volume_ml')!.toString(), 10) : null;
    const resistanceOhm = formData.get('resistance_ohm')?.toString()?.trim() || null;

    // Validation
    if (!name) {
      return fail(400, { error: 'Nama produk wajib diisi.' });
    }

    if (!['device', 'liquid', 'coil', 'catridge', 'other'].includes(category)) {
      return fail(400, { error: 'Kategori produk tidak valid.' });
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      return fail(400, { error: 'Harga beli dan harga jual tidak boleh negatif.' });
    }

    if (stock < 0) {
      return fail(400, { error: 'Stok tidak boleh negatif.' });
    }

    if (category === 'liquid') {
      if (!liquidType || !['Saltnic', 'Freebase'].includes(liquidType)) {
        return fail(400, { error: 'Tipe liquid (Saltnic / Freebase) wajib dipilih.' });
      }
      if (nicotineMg !== null && nicotineMg < 0) {
        return fail(400, { error: 'Kadar nikotin tidak boleh negatif.' });
      }
      if (volumeMl !== null && volumeMl <= 0) {
        return fail(400, { error: 'Volume liquid harus lebih dari 0 ml.' });
      }
    }

    if (category === 'catridge') {
      if (!resistanceOhm) {
        return fail(400, { error: 'Nilai resistance / ohm cartridge wajib diisi (misal: 0.8Ω).' });
      }
    }

    try {
      let productId: number | null = null;
      let sku = '';
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          sku = await ProductRepo.getNextSku(category);

          productId = await ProductRepo.create({
            sku,
            category,
            name,
            description,
            photo,
            purchase_price: purchasePrice,
            selling_price: sellingPrice,
            stock,
            unit,
            status,
            liquid_type: category === 'liquid' ? liquidType : null,
            nicotine_mg: category === 'liquid' ? nicotineMg : null,
            volume_ml: category === 'liquid' ? volumeMl : null,
            resistance_ohm: category === 'catridge' ? resistanceOhm : null
          });
          break;
        } catch (createErr: any) {
          if (createErr?.code === 'ER_DUP_ENTRY' && attempts < maxAttempts) {
            console.warn(`SKU duplicate detected (${sku}), retrying attempt ${attempts + 1}...`);
            continue;
          }
          throw createErr;
        }
      }

      if (!productId) {
        throw new Error('Gagal mendapatkan ID produk yang baru dibuat.');
      }

      // Record initial stock in mutation table if stock > 0
      if (stock > 0) {
        await pool.execute(
          `INSERT INTO stock_mutations (
            product_id, type, quantity, purchase_price, reference_type, reference_id, note, created_by
          ) VALUES (?, 'IN', ?, ?, 'stock_in', 'INITIAL-STOCK', 'Stok awal penambahan produk', ?)`,
          [productId, stock, purchasePrice, locals.user?.username || 'admin_vape']
        );
      }

      // Record audit log
      await pool.execute(
        `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
        ['PRODUCT_CREATE', `Menambahkan produk baru: ${sku} - ${name}`, locals.user?.username || 'admin_vape']
      );
    } catch (err: any) {
      console.error('Create product error:', err);
      return fail(500, { error: 'Terjadi kesalahan sistem saat menyimpan produk: ' + (err?.message || 'Unknown error') });
    }

    throw redirect(303, '/products');
  }
};
