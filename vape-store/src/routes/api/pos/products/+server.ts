import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await ProductRepo.list({ status: 'active', limit: 1000 });
    return json({ products: result.products });
  } catch (err: any) {
    console.error('API /api/pos/products error:', err);
    return json({ error: err.message || 'Gagal memuat produk POS.' }, { status: 500 });
  }
};
