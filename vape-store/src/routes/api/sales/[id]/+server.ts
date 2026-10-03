import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { SaleRepo } from '$lib/server/repositories/sale.repo.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) {
    return json({ error: 'ID transaksi tidak valid.' }, { status: 400 });
  }

  try {
    const sale = await SaleRepo.findById(id);
    if (!sale) {
      return json({ error: 'Transaksi tidak ditemukan.' }, { status: 404 });
    }
    return json(sale);
  } catch (err: any) {
    return json({ error: err.message || 'Gagal memuat transaksi.' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized. Silakan login terlebih dahulu.' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) {
    return json({ error: 'ID transaksi tidak valid.' }, { status: 400 });
  }

  try {
    const operator = locals.user.name || locals.user.username || 'admin_vape';
    const result = await SaleRepo.deleteSale(id, operator);
    return json({
      ...result,
      message: `Transaksi ${result.invoiceNumber} berhasil dihapus dan stok barang telah dikembalikan.`
    });
  } catch (err: any) {
    console.error(`Gagal menghapus transaksi #${id}:`, err);
    return json({ error: err.message || 'Gagal menghapus transaksi.' }, { status: 500 });
  }
};
