import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { StockRepo } from '$lib/server/repositories/stock.repo.js';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productId = url.searchParams.get('productId') ? parseInt(url.searchParams.get('productId')!, 10) : undefined;
    const type = (url.searchParams.get('type') as any) || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 25;

    const result = await StockRepo.listMutations({
      productId,
      type,
      startDate,
      endDate,
      page,
      limit
    });

    return json(result);
  } catch (err: any) {
    console.error('API /api/stock/mutations error:', err);
    return json({ error: err.message || 'Gagal memuat mutasi stok.' }, { status: 500 });
  }
};
