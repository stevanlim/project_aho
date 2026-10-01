import bcrypt from 'bcryptjs';
import { UserRepo, type SessionRow } from '../repositories/user.repo.js';

export const SESSION_COOKIE_NAME = 'ss_vape_session';
export const PENDING_COOKIE_NAME = 'ss_vape_pending';

export const AuthService = {
  async verifyStep1(username: string, password: string): Promise<{ success: boolean; userId?: number; error?: string }> {
    if (!username || !password) {
      return { success: false, error: 'Username dan password wajib diisi.' };
    }

    const user = await UserRepo.findByUsername(username.trim());
    if (!user) {
      return { success: false, error: 'Username atau password salah.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Username atau password salah.' };
    }

    return { success: true, userId: user.id };
  },

  async verifyStep2(userId: number, pin: string): Promise<{ success: boolean; sessionId?: string; role?: string; error?: string }> {
    if (!pin || pin.trim().length !== 6) {
      return { success: false, error: 'PIN harus berupa 6 digit angka.' };
    }

    const user = await UserRepo.findById(userId);
    if (!user) {
      return { success: false, error: 'Sesi login tidak valid. Silakan login kembali.' };
    }

    const pinMatch = await bcrypt.compare(pin.trim(), user.pin_hash);
    if (!pinMatch) {
      return { success: false, error: 'PIN yang dimasukkan salah.' };
    }

    // Create session in database
    const sessionId = await UserRepo.createSession(user.id, 7);
    return { success: true, sessionId, role: user.role };
  },

  async validateSession(sessionId: string): Promise<SessionRow | null> {
    if (!sessionId) return null;
    return await UserRepo.getSession(sessionId);
  },

  async destroySession(sessionId: string): Promise<void> {
    if (sessionId) {
      await UserRepo.deleteSession(sessionId);
    }
  }
};
