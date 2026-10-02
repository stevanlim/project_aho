import bcrypt from 'bcryptjs';
import { UserRepo, type SessionRow } from '../repositories/user.repo.js';

export const SESSION_COOKIE_NAME = 'ss_vape_session';
export const PENDING_COOKIE_NAME = 'ss_vape_pending';

// Fast in-memory session cache (TTL 30 seconds) to prevent redundant DB roundtrips on every request
interface CachedSession {
  session: SessionRow | null;
  expires: number;
}
const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 30 * 1000;

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

    const now = Date.now();
    const cached = sessionCache.get(sessionId);
    if (cached && cached.expires > now) {
      return cached.session;
    }

    const session = await UserRepo.getSession(sessionId);
    sessionCache.set(sessionId, { session, expires: now + CACHE_TTL_MS });
    return session;
  },

  async destroySession(sessionId: string): Promise<void> {
    if (sessionId) {
      sessionCache.delete(sessionId);
      await UserRepo.deleteSession(sessionId);
    }
  }
};
