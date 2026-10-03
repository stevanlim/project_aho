import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { products } = await ProductRepo.getStockAlerts({
      category: 'all',
      stockStatus: 'all',
      lowStockThreshold: 5
    });

    const alerts = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock,
      min_stock: 5,
      unit: p.unit,
      status: p.stock === 0 ? 'out' : 'low'
    }));

    return json({ alerts });
  } catch (err: any) {
    console.error('API /api/stock/alerts error:', err);
    return json({ error: err.message || 'Gagal memuat alert stok.' }, { status: 500 });
  }
};
