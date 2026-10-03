import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ReportRepo } from '$lib/server/repositories/report.repo.js';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await ReportRepo.getDashboardStats();
    return json(stats);
  } catch (err: any) {
    console.error('API /api/dashboard/stats error:', err);
    return json({ error: err.message || 'Gagal memuat statistik.' }, { status: 500 });
  }
};
