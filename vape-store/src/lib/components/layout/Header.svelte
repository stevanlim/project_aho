<script lang="ts">
	import { Calendar, Menu, Volume2, VolumeX } from 'lucide-svelte';
	import { toggleMobileSidebar } from '$lib/utils/nav.js';
	import { soundEnabled, toggleSound, playSuccessSound } from '$lib/utils/sound.js';
	import { showToast } from '$lib/components/ui/Toast.svelte';

	let { title = 'Dashboard' } = $props<{ title?: string }>();

	const todayFormatted = new Intl.DateTimeFormat('id-ID', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date());

	function handleSoundToggle() {
		const newState = toggleSound();
		if (newState) {
			playSuccessSound();
			showToast('Suara notifikasi kasir & stok AKTIF', 'info', 2500, false);
		} else {
			showToast('Suara notifikasi DINONAKTIFKAN (Mute)', 'info', 2500, false);
		}
	}
</script>

<header class="h-16 border-b border-slate-800/80 bg-[#0c1220]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 no-print gap-3">
	<!-- Left: Mobile/Tablet Hamburger & Title -->
	<div class="flex items-center gap-2.5 sm:gap-4 min-w-0">
		<!-- Hamburger Menu Button (Visible on screens < lg) -->
		<button
			type="button"
			onclick={toggleMobileSidebar}
			class="lg:hidden p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition border border-slate-700/80 shrink-0 cursor-pointer touch-manipulation relative z-30 flex items-center justify-center shadow-sm"
			aria-label="Buka menu navigasi"
			title="Buka Menu Navigasi"
		>
			<Menu class="w-5 h-5 text-emerald-400" />
		</button>

		<h1 class="text-base sm:text-lg font-extrabold text-white tracking-wide truncate">
			{title}
		</h1>
	</div>

	<!-- Right: Date, Sound Toggle & Status -->
	<div class="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 shrink-0">
		<!-- Sound Toggle Button (Speaker On / Mute) -->
		<button
			type="button"
			onclick={handleSoundToggle}
			class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer {$soundEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'}"
			title={$soundEnabled ? 'Suara notifikasi aktif (Klik untuk menonaktifkan)' : 'Suara notifikasi dinonaktifkan (Klik untuk mengaktifkan)'}
			aria-label={$soundEnabled ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
		>
			{#if $soundEnabled}
				<Volume2 class="w-4 h-4 text-emerald-400" />
				<span class="hidden md:inline font-semibold text-[11px]">Suara: ON</span>
			{:else}
				<VolumeX class="w-4 h-4 text-slate-400" />
				<span class="hidden md:inline font-semibold text-[11px]">Suara: MUTE</span>
			{/if}
		</button>

		<!-- Date display (hidden on small mobile) -->
		<div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
			<Calendar class="w-3.5 h-3.5 text-emerald-400" />
			<span class="font-medium text-[11px]">{todayFormatted}</span>
		</div>

		<!-- Store Online status -->
		<div class="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
			<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
			<span class="hidden sm:inline">SS VAPE Online</span>
			<span class="sm:hidden">Online</span>
		</div>
	</div>
</header>
