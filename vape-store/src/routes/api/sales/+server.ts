import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { SaleRepo } from '$lib/server/repositories/sale.repo.js';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const search = url.searchParams.get('search') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const paymentMethod = url.searchParams.get('paymentMethod') || undefined;
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 50;

    const result = await SaleRepo.list({
      search,
      startDate,
      endDate,
      paymentMethod,
      page,
      limit
    });

    return json(result);
  } catch (err: any) {
    console.error('API /api/sales error:', err);
    return json({ error: err.message || 'Gagal memuat transaksi.' }, { status: 500 });
  }
};
