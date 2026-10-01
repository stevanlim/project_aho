import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';
import pool from '$lib/server/db/index.js';

export const load: PageServerLoad = async ({ url }) => {
  const search = url.searchParams.get('search') || '';
  const category = (url.searchParams.get('category') as any) || 'all';
  const status = (url.searchParams.get('status') as any) || 'all';
  const stockStatus = (url.searchParams.get('stockStatus') as any) || 'all';
  const sortBy = (url.searchParams.get('sortBy') as any) || 'created_at';
  const sortOrder = (url.searchParams.get('sortOrder') as any) || 'DESC';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 15;

  const settings = await SettingsRepo.getSettings();
  const lowStockThreshold = settings.low_stock_threshold || 5;

  const [{ products, total }, stats, overallStats] = await Promise.all([
    ProductRepo.list({ search, category, status, stockStatus, lowStockThreshold, sortBy, sortOrder, page, limit }),
    ProductRepo.getInventoryStats({ search, category, status, stockStatus, lowStockThreshold }, lowStockThreshold),
    ProductRepo.getInventoryStats({ status: 'active' }, lowStockThreshold)
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    filters: { search, category, status, stockStatus, sortBy, sortOrder },
    lowStockThreshold,
    stats,
    overallStats
  };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = Number(formData.get('id'));

    if (!id) return fail(400, { error: 'ID produk tidak valid.' });

    try {
      const product = await ProductRepo.findById(id);
      if (!product) return fail(404, { error: 'Produk tidak ditemukan.' });

      const isUsed = await ProductRepo.isUsedInSales(id);
      if (isUsed) {
        await ProductRepo.softDelete(id);
        await pool.execute(
          `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
          ['PRODUCT_DEACTIVATE', `Menonaktifkan produk (ada riwayat transaksi): ${product.sku} - ${product.name}`, locals.user?.username || 'admin_vape']
        );
        return { success: true, message: 'Produk dinonaktifkan karena terdapat riwayat transaksi penjualan.' };
      } else {
        await ProductRepo.hardDelete(id);
        await pool.execute(
          `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
          ['PRODUCT_DELETE', `Menghapus permanen produk: ${product.sku} - ${product.name}`, locals.user?.username || 'admin_vape']
        );
        return { success: true, message: 'Produk berhasil dihapus.' };
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      return fail(500, { error: 'Gagal menghapus produk.' });
    }
  },

  toggleStatus: async ({ request }) => {
    const formData = await request.formData();
    const id = Number(formData.get('id'));
    const currentStatus = formData.get('currentStatus')?.toString();

    if (!id) return fail(400, { error: 'ID produk tidak valid.' });

    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await ProductRepo.update(id, { status: newStatus });
      return { success: true, message: `Status produk berhasil diubah menjadi ${newStatus}.` };
    } catch (err: any) {
      return fail(500, { error: 'Gagal mengubah status produk.' });
    }
  }
};
