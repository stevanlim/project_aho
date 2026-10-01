// Web Audio API Synthesizer for SS VAPE POS System
// 100% native browser audio synthesis - Zero external files, zero latency, works offline

import { writable } from 'svelte/store';

// Global reactive sound mute toggle
const INITIAL_SOUND_ENABLED = typeof window !== 'undefined' 
	? localStorage.getItem('ss_vape_sound_enabled') !== 'false' 
	: true;

export const soundEnabled = writable<boolean>(INITIAL_SOUND_ENABLED);

export function toggleSound(): boolean {
	let newState = true;
	soundEnabled.update((current) => {
		newState = !current;
		if (typeof window !== 'undefined') {
			localStorage.setItem('ss_vape_sound_enabled', newState ? 'true' : 'false');
		}
		return newState;
	});
	return newState;
}

export function isSoundEnabled(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem('ss_vape_sound_enabled') !== 'false';
}

// Shared AudioContext instance (initialized lazily on first user interaction)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (AudioContextClass) {
			audioCtx = new AudioContextClass();
		}
	}
	if (audioCtx && audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
	return audioCtx;
}

/**
 * SUCCESS SOUND: Ascending melodic major chime (C5 -> E5 -> G5 -> C6)
 * Dipakai saat: Transaksi kasir berhasil, pemasukan stok tersimpan, produk baru/edit disimpan.
 */
export function playSuccessSound() {
	if (!isSoundEnabled()) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;
	// Notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.5Hz)
	const notes = [523.25, 659.25, 783.99, 1046.5];

	notes.forEach((freq, index) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq, now + index * 0.08);

		const startTime = now + index * 0.08;
		const duration = 0.35;

		gain.gain.setValueAtTime(0, startTime);
		gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(startTime);
		osc.stop(startTime + duration);
	});
}

/**
 * WARNING SOUND: Gentle two-tone caution chime (A4 -> F#4)
 * Dipakai saat: Kasir memilih/melihat produk dengan stok menipis (<= min_stock atau <= 5).
 */
export function playWarningSound() {
	if (!isSoundEnabled()) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;
	// Notes: A4 (440Hz), F#4 (369.99Hz)
	const notes = [
		{ freq: 440, delay: 0, duration: 0.22, vol: 0.16 },
		{ freq: 369.99, delay: 0.12, duration: 0.32, vol: 0.14 }
	];

	notes.forEach(({ freq, delay, duration, vol }) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'triangle'; // Warm warning chime tone
		osc.frequency.setValueAtTime(freq, now + delay);

		const startTime = now + delay;
		gain.gain.setValueAtTime(0, startTime);
		gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(startTime);
		osc.stop(startTime + duration);
	});
}

/**
 * ALERT / DANGER SOUND (MERAH): Low-pitch authoritative descending buzz/alarm
 * Dipakai saat: Stok produk HABIS (0), transaksi ditolak, atau peringatan bahaya/merah.
 */
export function playAlertSound() {
	if (!isSoundEnabled()) return;
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;
	// Two-pulse descending buzzer tone: 310Hz -> 180Hz
	[0, 0.14].forEach((pulseDelay) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = 'sawtooth';
		const startTime = now + pulseDelay;
		const duration = 0.12;

		osc.frequency.setValueAtTime(pulseDelay === 0 ? 310 : 240, startTime);
		osc.frequency.exponentialRampToValueAtTime(pulseDelay === 0 ? 220 : 160, startTime + duration);

		gain.gain.setValueAtTime(0, startTime);
		gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
		gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(startTime);
		osc.stop(startTime + duration);
	});
}
