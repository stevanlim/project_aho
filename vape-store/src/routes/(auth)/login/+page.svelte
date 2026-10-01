<script lang="ts">
	import { enhance } from '$app/forms';
	import { Lock, User, Eye, EyeOff, ShieldCheck, Zap, Sparkles, Flame } from 'lucide-svelte';
	import VapeCharacter from '$lib/components/auth/VapeCharacter.svelte';

	let { form } = $props();

	let showPassword = $state(false);
	let isSubmitting = $state(false);
	let focusedInput = $state<'none' | 'username' | 'password'>('none');
</script>

<svelte:head>
	<title>Login Administrator - SS VAPE</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#060911] relative overflow-hidden selection:bg-emerald-500 selection:text-black">
	<!-- Ambient Background Glow & Cyber Neon Lights -->
	<div class="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
	<div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style="animation-delay: 2s;"></div>
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>

	<!-- Main Two-Column Split Container Inspired by Modern Dribbble Showcase -->
	<div class="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
		
		<!-- LEFT PANEL: ANIMATED VAPING CHARACTER SCENE -->
		<div class="lg:col-span-6 xl:col-span-7 bg-gradient-to-b from-[#0d1527] to-[#070b14] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px] lg:min-h-[560px]">
			<!-- Decorative Top Elements -->
			<div class="flex items-center justify-between z-10">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-2xl bg-white p-1 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-200">
						<img src="/images/logo.png" alt="Logo SS VAPE" class="w-full h-full object-contain rounded-xl" />
					</div>
					<div>
						<h1 class="text-xl font-extrabold tracking-wider text-white">
							SS <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">VAPE</span>
						</h1>
						<p class="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Teluk Batang • Est. 2019</p>
					</div>
				</div>

				<div class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
					<span>Vape Smoke Active</span>
				</div>
			</div>

			<!-- CENTER: ANIMATED VAPING SVG CHARACTER -->
			<div class="py-4 my-auto relative flex items-center justify-center">
				<VapeCharacter {focusedInput} {showPassword} />
			</div>

			<!-- Bottom Info Card -->
			<div class="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 z-10">
				<p class="flex items-center gap-1.5 text-slate-300">
					<Sparkles class="w-4 h-4 text-cyan-400 shrink-0" />
					<span>Karakter aktif menghembuskan asap vape & memantau input kasir</span>
				</p>
				<span class="text-[11px] text-emerald-400 font-mono font-semibold">v1.0.0</span>
			</div>
		</div>

		<!-- RIGHT PANEL: SLEEK LOGIN FORM -->
		<div class="lg:col-span-6 xl:col-span-5 bg-[#0c1220]/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-center">
			
			<!-- Form Header -->
			<div class="mb-6">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
					<span>Masuk Akun Kasir</span>
				</div>
				<h2 class="text-2xl font-black text-white tracking-tight">Selamat Datang</h2>
				<p class="text-xs text-slate-400 mt-1">Masukkan kredensial administrator toko vape Anda.</p>
			</div>

			<!-- Step 1 & 2 Indicator -->
			<div class="flex items-center justify-between mb-6 px-1">
				<div class="flex items-center gap-2">
					<span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">1</span>
					<span class="text-xs font-bold text-emerald-400">Kredensial</span>
				</div>
				<div class="h-0.5 flex-1 mx-3 bg-slate-800"></div>
				<div class="flex items-center gap-2">
					<span class="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500 text-xs font-bold">2</span>
					<span class="text-xs font-medium text-slate-500">Security PIN</span>
				</div>
			</div>

			<!-- Error Feedback Alert -->
			{#if form?.error}
				<div class="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
					<div class="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0"></div>
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Login Form -->
			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<!-- Username Input -->
				<div>
					<label for="username" class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
						Username
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
							<User class="w-4 h-4 {focusedInput === 'username' ? 'text-emerald-400' : ''}" />
						</div>
						<input
							type="text"
							id="username"
							name="username"
							value={form?.username ?? ''}
							required
							autocomplete="username"
							placeholder="Masukkan username admin"
							onfocus={() => (focusedInput = 'username')}
							onblur={() => (focusedInput = 'none')}
							class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition duration-200"
						/>
					</div>
				</div>

				<!-- Password Input -->
				<div>
					<label for="password" class="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
						Password
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
							<Lock class="w-4 h-4 {focusedInput === 'password' ? 'text-cyan-400' : ''}" />
						</div>
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							name="password"
							required
							autocomplete="current-password"
							placeholder="••••••••"
							onfocus={() => (focusedInput = 'password')}
							onblur={() => (focusedInput = 'none')}
							class="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition duration-200"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
							tabindex="-1"
							aria-label="Toggle password visibility"
						>
							{#if showPassword}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
						<span>Memverifikasi...</span>
					{:else}
						<span>Lanjutkan ke PIN Keamanan</span>
						<ShieldCheck class="w-4 h-4" />
					{/if}
				</button>
			</form>

			<!-- Security Footer Note -->
			<div class="mt-6 pt-4 border-t border-slate-800/80 text-center">
				<p class="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
					<Zap class="w-3.5 h-3.5 text-emerald-400" />
					Toko SS Vape &bull; Autentikasi 2-Tahap Terproteksi
				</p>
			</div>
		</div>
	</div>
</div>
