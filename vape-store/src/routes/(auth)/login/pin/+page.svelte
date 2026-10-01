<script lang="ts">
	import { enhance } from '$app/forms';
	import { KeyRound, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-svelte';

	let { form } = $props();

	let pin = $state('');
	let isSubmitting = $state(false);

	function addDigit(digit: string) {
		if (pin.length < 6) {
			pin += digit;
		}
	}

	function removeDigit() {
		if (pin.length > 0) {
			pin = pin.slice(0, -1);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (/^[0-9]$/.test(e.key)) {
			addDigit(e.key);
		} else if (e.key === 'Backspace') {
			removeDigit();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
	<title>Verifikasi PIN - SS VAPE</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-[#070b14] relative overflow-hidden selection:bg-emerald-500 selection:text-black">
	<!-- Background glow -->
	<div class="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
	<div class="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style="animation-delay: 1.5s;"></div>

	<div class="w-full max-w-md relative z-10">
		<div class="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-black/50">
			<!-- Header -->
			<div class="text-center mb-6">
				<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-1 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-500/20 overflow-hidden">
					<img src="/images/logo.png" alt="Logo SS VAPE" class="w-full h-full object-contain rounded-xl" />
				</div>
				<h1 class="text-xl font-bold text-white tracking-wide">
					SS <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">VAPE</span> Security PIN
				</h1>
				<p class="text-xs text-slate-400 mt-1">Masukkan 6-digit PIN keamanan admin Teluk Batang</p>
			</div>

			<!-- Step Indicator -->
			<div class="flex items-center justify-between mb-6 px-1">
				<div class="flex items-center gap-2">
					<span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">✓</span>
					<span class="text-xs font-medium text-slate-400">Kredensial</span>
				</div>
				<div class="h-0.5 w-12 bg-emerald-500/40"></div>
				<div class="flex items-center gap-2">
					<span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-black text-xs font-bold">2</span>
					<span class="text-xs font-medium text-emerald-400">Security PIN</span>
				</div>
			</div>

			<!-- Error Alert -->
			{#if form?.error}
				<div class="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
					<ShieldAlert class="w-4 h-4 text-rose-400 shrink-0" />
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- PIN Dots Display -->
			<div class="flex justify-center items-center gap-3.5 my-6">
				{#each Array(6) as _, i}
					<div
						class="w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-bold transition-all duration-200 {i < pin.length ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/20' : 'border-slate-700/80 bg-slate-900/60 text-slate-600'}"
					>
						{#if i < pin.length}
							<span class="w-3 h-3 rounded-full bg-emerald-400"></span>
						{:else}
							<span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
						{/if}
					</div>
				{/each}
			</div>

			<!-- PIN Numeric Keypad -->
			<div class="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-6">
				{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
					<button
						type="button"
						onclick={() => addDigit(digit)}
						class="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-lg border border-slate-700/60 hover:border-emerald-500/50 transition active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
					>
						{digit}
					</button>
				{/each}
				<button
					type="button"
					onclick={() => (pin = '')}
					class="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700/40 transition active:scale-95 cursor-pointer flex items-center justify-center"
				>
					Clear
				</button>
				<button
					type="button"
					onclick={() => addDigit('0')}
					class="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-lg border border-slate-700/60 hover:border-emerald-500/50 transition active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
				>
					0
				</button>
				<button
					type="button"
					onclick={removeDigit}
					class="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700/40 transition active:scale-95 cursor-pointer flex items-center justify-center"
				>
					⌫
				</button>
			</div>

			<!-- Hidden Form for Submission -->
			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
				class="space-y-3"
			>
				<input type="hidden" name="pin" value={pin} />

				<button
					type="submit"
					disabled={pin.length !== 6 || isSubmitting}
					class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
						<span>Memverifikasi PIN...</span>
					{:else}
						<span>Verifikasi & Buka Dashboard</span>
						<CheckCircle2 class="w-4 h-4" />
					{/if}
				</button>
			</form>

			<div class="mt-4 text-center">
				<a
					href="/login"
					class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition duration-150"
				>
					<ArrowLeft class="w-3.5 h-3.5" />
					Kembali ke input login
				</a>
			</div>
		</div>
	</div>
</div>
