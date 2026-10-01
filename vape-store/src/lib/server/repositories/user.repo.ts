import pool from '../db/index.js';
import type { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  pin_hash: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRow extends RowDataPacket {
  id: string;
  user_id: number;
  expires_at: Date;
  username: string;
  name: string;
  role: string;
}

export const UserRepo = {
  async findByUsername(username: string): Promise<UserRow | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  async findById(id: number): Promise<UserRow | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async createSession(userId: number, durationDays = 7): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    await pool.execute(
      'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [sessionId, userId, expiresAt]
    );

    return sessionId;
  },

  async getSession(sessionId: string): Promise<SessionRow | null> {
    const [rows] = await pool.execute<SessionRow[]>(
      `SELECT s.id, s.user_id, s.expires_at, u.username, u.name, u.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > NOW()
       LIMIT 1`,
      [sessionId]
    );
    return rows[0] || null;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await pool.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
  },

  async cleanExpiredSessions(): Promise<void> {
    await pool.execute('DELETE FROM sessions WHERE expires_at <= NOW()');
  }
};
