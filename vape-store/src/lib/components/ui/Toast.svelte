<script lang="ts" module>
	import { writable } from 'svelte/store';
	import { playSuccessSound, playWarningSound, playAlertSound } from '$lib/utils/sound.js';

	export interface ToastMessage {
		id: number;
		type: 'success' | 'warning' | 'error' | 'info';
		message: string;
	}

	export const toasts = writable<ToastMessage[]>([]);

	let nextId = 1;

	export function showToast(
		message: string,
		type: 'success' | 'warning' | 'error' | 'info' = 'success',
		duration = 4000,
		playSound = true
	) {
		const id = nextId++;
		toasts.update((all) => [...all, { id, type, message }]);

		// Play corresponding audio tone based on toast type
		if (playSound) {
			if (type === 'success') {
				playSuccessSound();
			} else if (type === 'warning') {
				playWarningSound();
			} else if (type === 'error') {
				playAlertSound();
			}
		}

		setTimeout(() => {
			toasts.update((all) => all.filter((t) => t.id !== id));
		}, duration);
	}
</script>

<script lang="ts">
	import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-svelte';

	function removeToast(id: number) {
		toasts.update((all) => all.filter((t) => t.id !== id));
	}
</script>

<div class="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-[calc(100vw-2rem)] no-print">
	{#each $toasts as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-slide-down {toast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100 shadow-emerald-500/20' : toast.type === 'warning' ? 'bg-amber-950/95 border-amber-500/60 text-amber-100 shadow-amber-500/20' : toast.type === 'error' ? 'bg-rose-950/95 border-rose-500/70 text-rose-100 shadow-rose-500/25' : 'bg-slate-900/95 border-cyan-500/50 text-cyan-100 shadow-cyan-500/20'}"
		>
			<div class="flex items-start gap-3 min-w-0">
				{#if toast.type === 'success'}
					<div class="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
						<CheckCircle2 class="w-5 h-5" />
					</div>
				{:else if toast.type === 'warning'}
					<div class="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
						<AlertTriangle class="w-5 h-5" />
					</div>
				{:else if toast.type === 'error'}
					<div class="p-1 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
						<AlertOctagon class="w-5 h-5" />
					</div>
				{:else}
					<div class="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
						<Info class="w-5 h-5" />
					</div>
				{/if}
				<div class="min-w-0">
					<p class="text-[11px] uppercase tracking-wider font-bold opacity-75">
						{toast.type === 'success' ? 'Berhasil' : toast.type === 'warning' ? 'Peringatan' : toast.type === 'error' ? 'Pemberitahuan / Alert' : 'Info'}
					</p>
					<p class="text-xs font-semibold leading-relaxed break-words">{toast.message}</p>
				</div>
			</div>
			<button
				type="button"
				onclick={() => removeToast(toast.id)}
				class="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
				aria-label="Tutup notifikasi"
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>
