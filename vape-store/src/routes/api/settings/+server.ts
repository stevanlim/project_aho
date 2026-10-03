import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await SettingsRepo.getSettings();
    return json(settings);
  } catch (err: any) {
    console.error('API /api/settings GET error:', err);
    return json({ error: err.message || 'Gagal memuat pengaturan toko.' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    await SettingsRepo.updateSettings(body);
    const updated = await SettingsRepo.getSettings();
    return json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('API /api/settings PUT error:', err);
    return json({ error: err.message || 'Gagal memperbarui pengaturan toko.' }, { status: 400 });
  }
};
