import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

const pool = mysql.createPool({
  host: env.DATABASE_HOST || process.env.DATABASE_HOST || 'localhost',
  port: Number(env.DATABASE_PORT || process.env.DATABASE_PORT || 3306),
  user: env.DATABASE_USER || process.env.DATABASE_USER || 'root',
  password: env.DATABASE_PASSWORD || process.env.DATABASE_PASSWORD || '',
  database: env.DATABASE_NAME || process.env.DATABASE_NAME || 'ss_vape',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

export default pool;
