<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { enhance } from '$app/forms';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import { Settings, Save, Store, MapPin, Phone, Receipt, AlertTriangle, CheckCircle2 } from 'lucide-svelte';

	let { data, form } = $props();
	const settings = $derived(data.settings);

	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.success && form?.message) {
			showToast(form.message, 'success');
		} else if (form?.error) {
			showToast(form.error, 'error');
		}
	});
</script>

<svelte:head>
	<title>Pengaturan Toko - SS VAPE</title>
</svelte:head>

<Header title="Pengaturan Toko & Sistem" />

<div class="p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
	<div>
		<h2 class="text-xl font-bold text-white flex items-center gap-2">
			<Settings class="w-5 h-5 text-emerald-400" />
			Identitas Toko & Konfigurasi Kasir
		</h2>
		<p class="text-xs text-slate-400 mt-0.5">Informasi toko yang akan tercetak pada struk invoice kasir dan batas peringatan stok.</p>
	</div>

	<div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl">
		{#if form?.error}
			<div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
				<AlertTriangle class="w-4 h-4 text-rose-400 shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}
			class="space-y-5"
		>
			<!-- Nama Toko -->
			<div>
				<label for="store_name" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
					<Store class="w-3.5 h-3.5 text-emerald-400" />
					Nama Toko Vape
				</label>
				<input
					type="text"
					id="store_name"
					name="store_name"
					value={settings.store_name || 'SS VAPE'}
					required
					class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Alamat Toko -->
			<div>
				<label for="address" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
					<MapPin class="w-3.5 h-3.5 text-cyan-400" />
					Alamat Toko (Opsional)
				</label>
				<input
					type="text"
					id="address"
					name="address"
					value={settings.address || ''}
					placeholder="Contoh: Jl. Ruko Vape No. 8, Jakarta Barat"
					class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Nomor Telepon -->
			<div>
				<label for="phone" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
					<Phone class="w-3.5 h-3.5 text-indigo-400" />
					Nomor Telepon / WhatsApp (Opsional)
				</label>
				<input
					type="text"
					id="phone"
					name="phone"
					value={settings.phone || ''}
					placeholder="Contoh: 0812-3456-7890"
					class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Footer Struk Invoice -->
			<div>
				<label for="invoice_footer" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
					<Receipt class="w-3.5 h-3.5 text-amber-400" />
					Pesan Footer Struk Invoice
				</label>
				<input
					type="text"
					id="invoice_footer"
					name="invoice_footer"
					value={settings.invoice_footer || 'Terima kasih telah berbelanja di SS VAPE'}
					class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Batas Stok Menipis -->
			<div>
				<label for="low_stock_threshold" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
					<AlertTriangle class="w-3.5 h-3.5 text-amber-400" />
					Batas Stok Menipis (Threshold Alert)
				</label>
				<input
					type="number"
					id="low_stock_threshold"
					name="low_stock_threshold"
					min="1"
					max="100"
					value={settings.low_stock_threshold || 5}
					class="w-full sm:w-1/3 px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
				<p class="text-[11px] text-slate-500 mt-1">Produk dengan stok di bawah atau sama dengan angka ini akan ditandai dengan badge "Menipis" berwarna kuning.</p>
			</div>

			<!-- Submit Button -->
			<div class="pt-4 border-t border-slate-800 flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting}
					class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
						<span>Menyimpan Pengaturan...</span>
					{:else}
						<CheckCircle2 class="w-4 h-4" />
						<span>Simpan Pengaturan</span>
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
