import type { PageServerLoad } from './$types.js';
import { StockRepo } from '$lib/server/repositories/stock.repo.js';

export const load: PageServerLoad = async ({ url }) => {
  const type = (url.searchParams.get('type') as any) || 'all';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 25;

  const { mutations, total } = await StockRepo.listMutations({
    type,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit
  });

  return {
    mutations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    filters: { type, startDate, endDate }
  };
};
