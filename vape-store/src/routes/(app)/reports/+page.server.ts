import type { PageServerLoad } from './$types.js';
import { ReportRepo } from '$lib/server/repositories/report.repo.js';

export const load: PageServerLoad = async ({ url }) => {
  const period = url.searchParams.get('period') || 'month';
  let startDate = url.searchParams.get('startDate') || '';
  let endDate = url.searchParams.get('endDate') || '';

  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);

  if (period === 'today') {
    startDate = formatYMD(now);
    endDate = formatYMD(now);
  } else if (period === 'week') {
    const dayOfWeek = now.getDay() || 7; // Monday = 1
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    startDate = formatYMD(monday);
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

  const report = await ReportRepo.getFinancialReport(startDate, endDate);

  return {
    report,
    filters: { period, startDate, endDate }
  };
};
