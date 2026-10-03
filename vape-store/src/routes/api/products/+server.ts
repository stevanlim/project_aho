import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { ProductRepo, type ProductQueryFilter } from '$lib/server/repositories/product.repo.js';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const search = url.searchParams.get('search') || undefined;
    const category = (url.searchParams.get('category') as any) || undefined;
    const status = (url.searchParams.get('status') as any) || undefined;
    const stockStatus = (url.searchParams.get('stockStatus') as any) || undefined;
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 50;

    const filter: ProductQueryFilter = {
      search,
      category,
      status,
      stockStatus,
      page,
      limit
    };

    const result = await ProductRepo.list(filter);
    return json(result);
  } catch (err: any) {
    console.error('API /api/products GET error:', err);
    return json({ error: err.message || 'Gagal memuat produk.' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const createdBy = locals.user.username || 'admin_vape';
    const newId = await ProductRepo.create({
      ...body,
      created_by: createdBy
    });

    const product = await ProductRepo.findById(newId);
    return json({ success: true, product, id: newId });
  } catch (err: any) {
    console.error('API /api/products POST error:', err);
    return json({ error: err.message || 'Gagal membuat produk.' }, { status: 400 });
  }
};
