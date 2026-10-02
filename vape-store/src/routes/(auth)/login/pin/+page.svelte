<script lang="ts">
	import { enhance } from '$app/forms';
	import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-svelte';

	let { form } = $props();

	let pin = $state('');
	let isSubmitting = $state(false);
	let pinInputRef = $state<HTMLInputElement | null>(null);
	let formRef = $state<HTMLFormElement | null>(null);

	function checkAutoSubmit(currentPin: string) {
		if (currentPin.length === 6 && !isSubmitting && formRef) {
			setTimeout(() => {
				formRef?.requestSubmit();
			}, 60);
		}
	}

	function addDigit(digit: string) {
		if (pin.length < 6) {
			pin += digit;
			checkAutoSubmit(pin);
		}
	}

	function removeDigit() {
		if (pin.length > 0) {
			pin = pin.slice(0, -1);
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const cleaned = target.value.replace(/\D/g, '').slice(0, 6);
		pin = cleaned;
		target.value = cleaned;
		checkAutoSubmit(cleaned);
	}

	function focusInput() {
		if (pinInputRef) {
			pinInputRef.focus();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (/^[0-9]$/.test(e.key)) {
			addDigit(e.key);
		} else if (e.key === 'Backspace') {
			removeDigit();
		}
	}

	$effect(() => {
		focusInput();
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
	<title>Verifikasi PIN - SS VAPE</title>
</svelte:head>

<!-- Outer wrapper with 100dvh for iOS Safari dynamic viewport & scrolling support -->
<div class="min-h-[100dvh] flex flex-col items-center justify-center p-3 sm:p-6 bg-[#070b14] relative overflow-y-auto selection:bg-emerald-500 selection:text-black">
	<!-- Background glow effects -->
	<div class="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
	<div class="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style="animation-delay: 1.5s;"></div>

	<div class="w-full max-w-sm sm:max-w-md my-auto relative z-10 py-3 sm:py-0">
		<div class="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-2xl shadow-black/50">
			<!-- Header -->
			<div class="text-center mb-4 sm:mb-5">
				<div class="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1 border border-emerald-500/30 mb-2.5 shadow-md shadow-emerald-500/20 overflow-hidden">
					<img src="/images/logo.png" alt="Logo SS VAPE" class="w-full h-full object-contain rounded-xl" />
				</div>
				<h1 class="text-lg sm:text-xl font-bold text-white tracking-wide">
					SS <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">VAPE</span> Security PIN
				</h1>
				<p class="text-xs text-slate-400 mt-0.5">Masukkan 6-digit PIN keamanan admin Teluk Batang</p>
			</div>

			<!-- Step Indicator -->
			<div class="flex items-center justify-between mb-4 sm:mb-5 px-2">
				<div class="flex items-center gap-1.5 sm:gap-2">
					<span class="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold">✓</span>
					<span class="text-[11px] sm:text-xs font-medium text-slate-400">Kredensial</span>
				</div>
				<div class="h-0.5 w-10 sm:w-14 bg-emerald-500/40"></div>
				<div class="flex items-center gap-1.5 sm:gap-2">
					<span class="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-black text-[10px] sm:text-xs font-bold">2</span>
					<span class="text-[11px] sm:text-xs font-medium text-emerald-400">Security PIN</span>
				</div>
			</div>

			<!-- Error Alert -->
			{#if form?.error}
				<div class="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
					<ShieldAlert class="w-4 h-4 text-rose-400 shrink-0" />
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Interactive PIN Input Box (Tap to focus iOS/Safari native keyboard) -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="relative cursor-pointer my-3 sm:my-5" onclick={focusInput}>
				<!-- Native hidden input: triggers iOS numeric keyboard & autocomplete -->
				<input
					bind:this={pinInputRef}
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="6"
					autocomplete="one-time-code"
					value={pin}
					oninput={handleInput}
					class="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer pointer-events-auto"
					aria-label="Masukkan 6-digit PIN"
				/>

				<!-- Visual PIN 6-Box Display -->
				<div class="flex justify-center items-center gap-2.5 sm:gap-3.5">
					{#each Array(6) as _, i}
						{@const filled = i < pin.length}
						{@const isCurrent = i === pin.length}
						<div
							class="w-10 h-12 sm:w-11 sm:h-13 rounded-xl border flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-150 {filled ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/20' : isCurrent ? 'border-cyan-400/80 bg-slate-900 ring-2 ring-cyan-500/20' : 'border-slate-800 bg-slate-900/60 text-slate-600'}"
						>
							{#if filled}
								<span class="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
							{:else if isCurrent}
								<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
							{:else}
								<span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- PIN Numeric Keypad (Touch-manipulation optimized for iOS Safari) -->
			<div class="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] mx-auto mb-4 sm:mb-5">
				{#each ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as digit}
					<button
						type="button"
						onclick={() => addDigit(digit)}
						class="h-10 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-semibold text-base sm:text-lg border border-slate-700/60 hover:border-emerald-500/50 transition cursor-pointer touch-manipulation flex items-center justify-center shadow-sm select-none"
					>
						{digit}
					</button>
				{/each}
				<button
					type="button"
					onclick={() => (pin = '')}
					class="h-10 sm:h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700/40 transition cursor-pointer touch-manipulation flex items-center justify-center select-none"
				>
					Clear
				</button>
				<button
					type="button"
					onclick={() => addDigit('0')}
					class="h-10 sm:h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white font-semibold text-base sm:text-lg border border-slate-700/60 hover:border-emerald-500/50 transition cursor-pointer touch-manipulation flex items-center justify-center shadow-sm select-none"
				>
					0
				</button>
				<button
					type="button"
					onclick={removeDigit}
					class="h-10 sm:h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-white text-sm font-semibold border border-slate-700/40 transition cursor-pointer touch-manipulation flex items-center justify-center select-none"
				>
					⌫
				</button>
			</div>

			<!-- Form for Submission -->
			<form
				bind:this={formRef}
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
					class="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
						<span>Memverifikasi PIN...</span>
					{:else}
						<span>Verifikasi & Masuk</span>
						<CheckCircle2 class="w-4 h-4" />
					{/if}
				</button>
			</form>

			<div class="mt-3.5 sm:mt-4 text-center">
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
