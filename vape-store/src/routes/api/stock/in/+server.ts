import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { StockRepo } from '$lib/server/repositories/stock.repo.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const pid = Number(body.productId ?? body.product_id);
    const qty = Number(body.quantity);
    const purchasePrice = Number(body.purchasePrice ?? body.purchase_price) || 0;
    const note = body.note || '';

    if (!pid || isNaN(pid) || !qty || qty <= 0) {
      return json({ error: 'Produk dan kuantiti wajib diisi.' }, { status: 400 });
    }

    const createdBy = locals.user.username || 'admin_vape';
    await StockRepo.addStockIn(
      pid,
      qty,
      purchasePrice,
      note,
      createdBy
    );

    return json({ success: true, message: 'Stok masuk berhasil dicatat.' });
  } catch (err: any) {
    console.error('API /api/stock/in error:', err);
    return json({ error: err.message || 'Gagal mencatat stok masuk.' }, { status: 400 });
  }
};
