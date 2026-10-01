import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import fs from 'fs';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: 'Format foto harus berupa JPG, JPEG, PNG, atau WEBP.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return json({ error: 'Ukuran foto maksimal 5MB.' }, { status: 400 });
    }

    // Prepare upload directory
    const uploadDir = path.resolve('static', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate safe unique filename
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    const defaultExt = mimeMap[file.type] || '.jpg';
    const ext = path.extname(file.name) || defaultExt;
    const cleanExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `prod_${timestamp}_${random}${cleanExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/products/${filename}`;
    return json({ url: publicUrl });
  } catch (err: any) {
    console.error('Error uploading product photo:', err);
    return json({ error: 'Gagal mengunggah foto produk.' }, { status: 500 });
  }
};
