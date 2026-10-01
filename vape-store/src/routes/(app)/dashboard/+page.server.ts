import type { PageServerLoad } from './$types.js';
import { ReportRepo } from '$lib/server/repositories/report.repo.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';

export const load: PageServerLoad = async ({ locals }) => {
  const settings = await SettingsRepo.getSettings();
  const userRole = locals.user?.role || 'admin';
  const isKasir = userRole === 'kasir';

  const stats = await ReportRepo.getDashboardStats(settings.low_stock_threshold || 5);
  const dailyChart = await ReportRepo.getDailyChartData(7);
  const topProducts = await ReportRepo.getTopSellingProducts(5);
  const categorySales = await ReportRepo.getCategorySales();

  // Revenue mutations summary (store-wide for all users)
  const mutations = await ReportRepo.getRevenueMutations();
  const revenueSummary = mutations.summary;

  return {
    stats,
    dailyChart,
    topProducts,
    categorySales,
    settings,
    userRole,
    userName: locals.user?.name || 'User',
    revenueSummary
  };
};

