import type { PageServerLoad } from './$types.js';
import { SaleRepo } from '$lib/server/repositories/sale.repo.js';

export const load: PageServerLoad = async ({ url }) => {
  const search = url.searchParams.get('search') || '';
  const filterPreset = url.searchParams.get('preset') || '';
  let startDate = url.searchParams.get('startDate') || '';
  let endDate = url.searchParams.get('endDate') || '';
  const paymentMethod = url.searchParams.get('paymentMethod') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 20;

  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);

  if (filterPreset === 'today') {
    startDate = formatYMD(now);
    endDate = formatYMD(now);
  } else if (filterPreset === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    startDate = formatYMD(yesterday);
    endDate = formatYMD(yesterday);
  } else if (filterPreset === '7days') {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    startDate = formatYMD(sevenDaysAgo);
    endDate = formatYMD(now);
  } else if (filterPreset === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = formatYMD(firstDay);
    endDate = formatYMD(now);
  } else if (filterPreset === 'thisYear') {
    const firstDayYear = new Date(now.getFullYear(), 0, 1);
    startDate = formatYMD(firstDayYear);
    endDate = formatYMD(now);
  }

  const { sales, total } = await SaleRepo.list({
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    paymentMethod,
    page,
    limit
  });

  return {
    sales,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    filters: { search, preset: filterPreset, startDate, endDate, paymentMethod }
  };
};
