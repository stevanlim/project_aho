import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { SettingsRepo } from '$lib/server/repositories/settings.repo.js';
import pool from '$lib/server/db/index.js';

export const load: PageServerLoad = async () => {
  const settings = await SettingsRepo.getSettings();
  return {
    settings
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const storeName = formData.get('store_name')?.toString()?.trim() || 'SS VAPE';
    const address = formData.get('address')?.toString()?.trim() || null;
    const phone = formData.get('phone')?.toString()?.trim() || null;
    const invoiceFooter = formData.get('invoice_footer')?.toString()?.trim() || 'Terima kasih telah berbelanja di SS VAPE';
    const lowStockThreshold = parseInt(formData.get('low_stock_threshold')?.toString() || '5', 10);

    try {
      await SettingsRepo.updateSettings({
        store_name: storeName,
        address,
        phone,
        invoice_footer: invoiceFooter,
        low_stock_threshold: isNaN(lowStockThreshold) ? 5 : lowStockThreshold
      });

      // Audit log
      await pool.execute(
        `INSERT INTO audit_logs (action, details, created_by) VALUES (?, ?, ?)`,
        ['SETTINGS_UPDATE', `Memperbarui konfigurasi toko: ${storeName}`, locals.user?.username || 'admin_vape']
      );

      return {
        success: true,
        message: 'Pengaturan toko berhasil diperbarui.'
      };
    } catch (err: any) {
      console.error('Settings update error:', err);
      return fail(500, { error: 'Gagal memperbarui pengaturan toko.' });
    }
  }
};
