import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ProductRepo } from '$lib/server/repositories/product.repo.js';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) {
    return json({ error: 'ID tidak valid' }, { status: 400 });
  }

  try {
    const product = await ProductRepo.findById(id);
    if (!product) {
      return json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    return json(product);
  } catch (err: any) {
    return json({ error: err.message || 'Gagal memuat produk' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) {
    return json({ error: 'ID tidak valid' }, { status: 400 });
  }

  try {
    const body = await request.json();
    await ProductRepo.update(id, body);
    const updated = await ProductRepo.findById(id);
    return json({ success: true, product: updated });
  } catch (err: any) {
    return json({ error: err.message || 'Gagal memperbarui produk' }, { status: 400 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) {
    return json({ error: 'ID tidak valid' }, { status: 400 });
  }

  try {
    await ProductRepo.softDelete(id);
    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || 'Gagal menghapus produk' }, { status: 400 });
  }
};
