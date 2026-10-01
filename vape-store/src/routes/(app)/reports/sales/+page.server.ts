import type { PageServerLoad } from './$types.js';
import { ReportRepo } from '$lib/server/repositories/report.repo.js';

export const load: PageServerLoad = async ({ url, locals }) => {
  const period = url.searchParams.get('period') || 'today';
  let startDate = url.searchParams.get('startDate') || '';
  let endDate = url.searchParams.get('endDate') || '';

  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);

  if (period === 'today') {
    startDate = formatYMD(now);
    endDate = formatYMD(now);
  } else if (period === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = formatYMD(firstDay);
    endDate = formatYMD(now);
  } else if (period === 'year') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    startDate = formatYMD(firstDay);
    endDate = formatYMD(now);
  }

  const [items, mutations] = await Promise.all([
    ReportRepo.getItemSalesLog(startDate, endDate),
    ReportRepo.getRevenueMutations(startDate, endDate)
  ]);

  return {
    items,
    mutations,
    filters: { period, startDate, endDate },
    userRole: locals.user?.role || 'admin',
    userName: locals.user?.name || 'Admin'
  };
};

