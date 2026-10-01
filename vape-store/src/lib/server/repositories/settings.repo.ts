import pool from '../db/index.js';
import type { RowDataPacket } from 'mysql2';
import type { Settings } from '$lib/types/index.js';

export const SettingsRepo = {
  async getSettings(): Promise<Settings> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM settings WHERE id = 1 LIMIT 1'
    );
    if (rows.length === 0) {
      return {
        id: 1,
        store_name: 'SS VAPE',
        address: 'Jl. Ruko Vape No. 8, Jakarta',
        phone: '0812-3456-7890',
        invoice_footer: 'Terima kasih telah berbelanja di SS VAPE',
        low_stock_threshold: 5
      };
    }
    return rows[0] as Settings;
  },

  async updateSettings(data: Partial<Omit<Settings, 'id'>>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowed = ['store_name', 'address', 'phone', 'invoice_footer', 'low_stock_threshold'];
    for (const key of allowed) {
      if (key in data) {
        fields.push(`${key} = ?`);
        params.push((data as Record<string, unknown>)[key]);
      }
    }

    if (fields.length > 0) {
      await pool.execute(
        `UPDATE settings SET ${fields.join(', ')} WHERE id = 1`,
        params
      );
    }
  }
};
