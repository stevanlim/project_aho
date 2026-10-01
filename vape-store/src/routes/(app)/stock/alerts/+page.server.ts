import type { PageServerLoad } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';

export const load: PageServerLoad = async ({ url, locals }) => {
  const category = (url.searchParams.get('category') as any) || 'all';
  const status = (url.searchParams.get('status') as any) || 'all'; // 'all' (habis & menipis), 'out' (hanya habis), 'low' (hanya menipis)
  const search = url.searchParams.get('search') || '';

  const settings = await SettingsRepo.getSettings();
  const lowStockThreshold = settings.low_stock_threshold || 5;

  const { products, total, outOfStockCount, lowStockCount, categoryBreakdown } =
    await ProductRepo.getStockAlerts({
      category,
      stockStatus: status,
      search,
      lowStockThreshold
    });

  // Calculate estimated restocking investment needed
  // Recommended restock target: at least (lowStockThreshold * 2) or 10 units
  const targetStock = Math.max(10, lowStockThreshold * 2);

  const restockingAnalysis = products.map((prod) => {
    const currentStock = Number(prod.stock);
    const neededQty = Math.max(0, targetStock - currentStock);
    const estimatedModal = neededQty * Number(prod.purchase_price);
    const isOut = currentStock <= 0;
    return {
      ...prod,
      isOut,
      neededQty,
      estimatedModal
    };
  });

  const totalNeededUnits = restockingAnalysis.reduce((acc, p) => acc + p.neededQty, 0);
  const totalEstimatedRestockCost = restockingAnalysis.reduce((acc, p) => acc + p.estimatedModal, 0);
  const currentItemsCapital = restockingAnalysis.reduce(
    (acc, p) => acc + Number(p.purchase_price) * Number(p.stock),
    0
  );

  return {
    products: restockingAnalysis,
    total,
    outOfStockCount,
    lowStockCount,
    categoryBreakdown,
    targetStock,
    totalNeededUnits,
    totalEstimatedRestockCost,
    currentItemsCapital,
    filters: {
      category,
      status,
      search
    },
    lowStockThreshold,
    settings,
    printedAt: new Date().toISOString(),
    printedBy: locals.user?.name || locals.user?.username || 'Admin SS VAPE'
  };
};
