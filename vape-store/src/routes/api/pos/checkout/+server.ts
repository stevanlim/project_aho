import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { SaleRepo } from '$lib/server/repositories/sale.repo.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, discount, paidAmount, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return json({ error: 'Keranjang belanja tidak boleh kosong.' }, { status: 400 });
    }

    const result = await SaleRepo.processCheckout({
      items,
      discount: Number(discount) || 0,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod: paymentMethod || 'Cash',
      createdBy: locals.user.username || 'admin_vape'
    });

    return json({
      success: true,
      saleId: result.saleId,
      invoiceNumber: result.invoiceNumber
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return json({ error: err.message || 'Transaksi gagal diproses.' }, { status: 400 });
  }
};
