import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'ss_vape'
});

console.log('Connected to database ss_vape...');

try {
  // 1. Seed Admin User
  const passwordHash = await bcrypt.hash('admin0208', 10);
  const pinHash = await bcrypt.hash('020804', 10);

  await connection.execute(`
    INSERT INTO users (id, username, password_hash, pin_hash, name, role)
    VALUES (1, 'admin_vape', ?, ?, 'Admin SS Vape', 'admin')
    ON DUPLICATE KEY UPDATE 
      password_hash = VALUES(password_hash),
      pin_hash = VALUES(pin_hash);
  `, [passwordHash, pinHash]);

  console.log('✓ Admin user seeded: admin_vape');

  // 1b. Seed Kasir User
  const kasirPasswordHash = await bcrypt.hash('kasir020804', 10);
  const kasirPinHash = await bcrypt.hash('020804', 10);

  await connection.execute(`
    INSERT INTO users (username, password_hash, pin_hash, name, role)
    VALUES ('kasirssvape99', ?, ?, 'Kasir SS Vape', 'kasir')
    ON DUPLICATE KEY UPDATE 
      password_hash = VALUES(password_hash),
      pin_hash = VALUES(pin_hash),
      name = VALUES(name),
      role = VALUES(role);
  `, [kasirPasswordHash, kasirPinHash]);

  console.log('✓ Kasir user seeded: kasirssvape99');

  // 2. Seed Settings
  await connection.execute(`
    INSERT INTO settings (id, store_name, address, phone, invoice_footer, low_stock_threshold)
    VALUES (1, 'SS VAPE', 'Jl. Utama Vape No. 8, Jakarta', '0812-3456-7890', 'Terima kasih telah berbelanja di SS VAPE', 5)
    ON DUPLICATE KEY UPDATE 
      store_name = VALUES(store_name),
      invoice_footer = VALUES(invoice_footer);
  `);

  console.log('✓ Default settings seeded');

  // 3. Seed Sample Products (if empty)
  const [existingProducts] = await connection.query('SELECT COUNT(*) as count FROM products');
  if (existingProducts[0].count === 0) {
    const products = [
      {
        sku: 'DEV-0001',
        category: 'device',
        name: 'Vaporesso XROS 4',
        description: 'Pod system canggih dengan baterai 1000mAh dan teknologi Corex 2.0',
        photo: null,
        purchase_price: 250000,
        selling_price: 320000,
        stock: 5,
        unit: 'pcs',
        status: 'active',
        liquid_type: null,
        nicotine_mg: null,
        volume_ml: null,
        resistance_ohm: null
      },
      {
        sku: 'LIQ-0001',
        category: 'liquid',
        name: 'Nasty Juice Cush Man Saltnic',
        description: 'Rasa mangga eksotis dingin yang menyegarkan',
        photo: null,
        purchase_price: 85000,
        selling_price: 115000,
        stock: 12,
        unit: 'bottle',
        status: 'active',
        liquid_type: 'Saltnic',
        nicotine_mg: 25,
        volume_ml: 30,
        resistance_ohm: null
      },
      {
        sku: 'LIQ-0002',
        category: 'liquid',
        name: 'Oat Drips V1 Freebase',
        description: 'Sereal oat manis bercampur susu creamy hangat',
        photo: null,
        purchase_price: 110000,
        selling_price: 145000,
        stock: 8,
        unit: 'bottle',
        status: 'active',
        liquid_type: 'Freebase',
        nicotine_mg: 3,
        volume_ml: 60,
        resistance_ohm: null
      },
      {
        sku: 'COI-0001',
        category: 'coil',
        name: 'Voopoo PnP-VM1 Coil 0.3Ω',
        description: 'Mesh coil untuk flavor maksimal dan vapor tebal',
        photo: null,
        purchase_price: 30000,
        selling_price: 45000,
        stock: 20,
        unit: 'pcs',
        status: 'active',
        liquid_type: null,
        nicotine_mg: null,
        volume_ml: null,
        resistance_ohm: null
      },
      {
        sku: 'CAT-0001',
        category: 'catridge',
        name: 'XROS Series Cartridge 0.8Ω',
        description: 'Cartridge 3ml top-fill anti bocor dengan Corex mesh',
        photo: null,
        purchase_price: 32000,
        selling_price: 45000,
        stock: 15,
        unit: 'pcs',
        status: 'active',
        liquid_type: null,
        nicotine_mg: null,
        volume_ml: null,
        resistance_ohm: '0.8Ω'
      }
    ];

    for (const p of products) {
      const [result] = await connection.execute(`
        INSERT INTO products (sku, category, name, description, photo, purchase_price, selling_price, stock, unit, status, liquid_type, nicotine_mg, volume_ml, resistance_ohm)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.sku, p.category, p.name, p.description, p.photo, p.purchase_price, p.selling_price, p.stock, p.unit, p.status, p.liquid_type, p.nicotine_mg, p.volume_ml, p.resistance_ohm]);

      // Add initial stock mutation
      await connection.execute(`
        INSERT INTO stock_mutations (product_id, type, quantity, purchase_price, reference_type, reference_id, note, created_by)
        VALUES (?, 'IN', ?, ?, 'stock_in', 'SEED-INITIAL', 'Stok awal inventori', 'admin_vape')
      `, [result.insertId, p.stock, p.purchase_price]);
    }

    console.log('✓ 5 sample products & initial stock mutations seeded');
  } else {
    console.log('Products already exist, skipping product seed');
  }

  console.log('\n--- Seeding Complete Successfully! ---');
} catch (err) {
  console.error('Seeding failed:', err);
} finally {
  await connection.end();
}
