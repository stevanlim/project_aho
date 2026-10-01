import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { SaleRepo } from '$lib/server/repositories/sale.repo.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) throw error(404, 'Transaksi tidak ditemukan.');

  const [sale, settings] = await Promise.all([
    SaleRepo.findById(id),
    SettingsRepo.getSettings()
  ]);

  if (!sale) throw error(404, 'Transaksi tidak ditemukan.');

  return {
    sale,
    settings
  };
};
