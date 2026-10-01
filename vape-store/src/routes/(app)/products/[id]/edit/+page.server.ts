import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';
import pool from '$lib/server/db/index.js';
import type { ProductCategory } from '$lib/types/index.js';

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) throw error(404, 'Produk tidak ditemukan');

  const product = await ProductRepo.findById(id);
  if (!product) throw error(404, 'Produk tidak ditemukan');

  return {
    product
  };
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const id = Number(params.id);
    if (isNaN(id)) return fail(400, { error: 'ID produk tidak valid.' });

    const currentProduct = await ProductRepo.findById(id);
    if (!currentProduct) throw error(404, 'Produk tidak ditemukan.');

    const formData = await request.formData();
    const categoryInput = formData.get('category')?.toString() as ProductCategory | undefined;
    const category: ProductCategory = categoryInput && ['device', 'liquid', 'coil', 'catridge', 'other'].includes(categoryInput)
      ? categoryInput
      : currentProduct.category;

    const name = formData.get('name')?.toString()?.trim() || '';
    const description = formData.get('description')?.toString()?.trim() || null;
    const photo = formData.get('photo')?.toString()?.trim() || null;
    const purchasePrice = parseFloat(formData.get('purchase_price')?.toString() || '0');
    const sellingPrice = parseFloat(formData.get('selling_price')?.toString() || '0');
    const unit = formData.get('unit')?.toString()?.trim() || 'pcs';
    const status = (formData.get('status')?.toString() as any) || 'active';

    const liquidType = (formData.get('liquid_type')?.toString() as any) || null;
    const nicotineMg = formData.get('nicotine_mg') ? parseInt(formData.get('nicotine_mg')!.toString(), 10) : null;
    const volumeMl = formData.get('volume_ml') ? parseInt(formData.get('volume_ml')!.toString(), 10) : null;
    const resistanceOhm = formData.get('resistance_ohm')?.toString()?.trim() || null;

    if (!name) {
      return fail(400, { error: 'Nama produk wajib diisi.' });
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      return fail(400, { error: 'Harga beli dan jual tidak boleh negatif.' });
    }

    try {
      let sku = currentProduct.sku;
      let categoryChanged = false;
      if (category !== currentProduct.category) {
        sku = await ProductRepo.getNextSku(category);
        categoryChanged = true;
      }

      await ProductRepo.update(id, {
        sku,
        category,
        name,
        description,
        photo,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        unit,
        status,
        liquid_type: category === 'liquid' ? (liquidType || 'Saltnic') : null,
        nicotine_mg: category === 'liquid' ? nicotineMg : null,
        volume_ml: category === 'liquid' ? (volumeMl || 30) : null,
        resistance_ohm: category === 'catridge' ? resistanceOhm : null
      });

      // Audit log
      const auditDetail = categoryChanged
        ? `Memperbarui produk ID #${id}: ${name} (Kategori diubah: ${currentProduct.category.toUpperCase()} -> ${category.toUpperCase()}, SKU baru: ${sku})`
        : `Memperbarui data produk ID #${id}: ${name}`;

      await pool.execute(
        `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
        ['PRODUCT_UPDATE', auditDetail, locals.user?.username || 'admin_vape']
      );
    } catch (err: any) {
      console.error('Update error:', err);
      return fail(500, { error: 'Gagal memperbarui produk.' });
    }

    throw redirect(303, '/products');
  }
};
