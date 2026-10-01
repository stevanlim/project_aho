import type { PageServerLoad } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';

export const load: PageServerLoad = async () => {
  const [products, settings] = await Promise.all([
    ProductRepo.listActiveForPos(),
    SettingsRepo.getSettings()
  ]);

  return {
    products,
    settings
  };
};
