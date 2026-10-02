<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import { playSuccessSound } from '$lib/utils/sound.js';
	import {
		Receipt,
		Search,
		Filter,
		Calendar,
		ArrowRight,
		ChevronLeft,
		ChevronRight,
		Eye,
		ShoppingCart,
		Trash2,
		AlertTriangle,
		Loader2,
		X
	} from 'lucide-svelte';

	let { data } = $props();

	let searchQuery = $state(data.filters.search);
	let selectedPreset = $state(data.filters.preset);
	let startDate = $state(data.filters.startDate);
	let endDate = $state(data.filters.endDate);
	let selectedMethod = $state(data.filters.paymentMethod);

	// State for deleting mistaken transactions
	let saleToDelete = $state<any | null>(null);
	let isDeleting = $state(false);

	function confirmDeleteSale(sale: any) {
		saleToDelete = sale;
	}

	async function handleDeleteConfirmed() {
		if (!saleToDelete || isDeleting) return;
		isDeleting = true;

		try {
			const res = await fetch(`/api/sales/${saleToDelete.id}`, {
				method: 'DELETE'
			});
			const result = await res.json();

			if (!res.ok || result.error) {
				throw new Error(result.error || 'Gagal menghapus transaksi.');
			}

			showToast(result.message || `Transaksi ${saleToDelete.invoice_number} berhasil dihapus & stok dikembalikan!`, 'success');
			playSuccessSound();

			saleToDelete = null;
			await invalidateAll();
		} catch (err: any) {
			console.error('Delete error:', err);
			showToast(err.message || 'Gagal menghapus transaksi.', 'error');
		} finally {
			isDeleting = false;
		}
	}

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	function formatDateTime(dateStr: string) {
		return new Intl.DateTimeFormat('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(dateStr));
	}

	function applyFilters() {
		const url = new URL(page.url);
		if (searchQuery) url.searchParams.set('search', searchQuery);
		else url.searchParams.delete('search');

		if (selectedPreset) url.searchParams.set('preset', selectedPreset);
		else url.searchParams.delete('preset');

		if (selectedPreset === 'custom') {
			if (startDate) url.searchParams.set('startDate', startDate);
			if (endDate) url.searchParams.set('endDate', endDate);
		} else {
			url.searchParams.delete('startDate');
			url.searchParams.delete('endDate');
		}

		if (selectedMethod && selectedMethod !== 'all') url.searchParams.set('paymentMethod', selectedMethod);
		else url.searchParams.delete('paymentMethod');

		url.searchParams.set('page', '1');
		goto(url.toString());
	}

	function setPreset(preset: string) {
		selectedPreset = preset;
		applyFilters();
	}

	function changePage(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(newPage));
		goto(url.toString());
	}
</script>

<svelte:head>
	<title>Riwayat Transaksi - SS VAPE</title>
</svelte:head>

<Header title="Riwayat Transaksi Penjualan" />

<div class="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold text-white flex items-center gap-2">
				<Receipt class="w-5 h-5 text-emerald-400" />
				Semua Transaksi
			</h2>
			<p class="text-xs text-slate-400 mt-0.5">Daftar rekapan transaksi penjualan dan cetak ulang struk invoice kasir.</p>
		</div>
		<a
			href="/pos"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
		>
			<ShoppingCart class="w-4 h-4" />
			<span>Buka Kasir Baru</span>
		</a>
	</div>

	<!-- Quick Preset Buttons -->
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			onclick={() => setPreset('')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === '' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			Semua Waktu
		</button>
		<button
			type="button"
			onclick={() => setPreset('today')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === 'today' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			Hari Ini
		</button>
		<button
			type="button"
			onclick={() => setPreset('yesterday')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === 'yesterday' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			Kemarin
		</button>
		<button
			type="button"
			onclick={() => setPreset('7days')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === '7days' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			7 Hari Terakhir
		</button>
		<button
			type="button"
			onclick={() => setPreset('thisMonth')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === 'thisMonth' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			Bulan Ini
		</button>
		<button
			type="button"
			onclick={() => setPreset('thisYear')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === 'thisYear' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			Tahun Ini
		</button>
		<button
			type="button"
			onclick={() => (selectedPreset = 'custom')}
			class="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer {selectedPreset === 'custom' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}"
		>
			Custom Tanggal
		</button>
	</div>

	<!-- Filter Inputs -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-md flex flex-wrap items-center gap-3">
		<!-- Search by Invoice -->
		<div class="flex-1 min-w-[200px] relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
				<Search class="w-4 h-4" />
			</div>
			<input
				type="text"
				placeholder="Cari nomor invoice (INV-...)"
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
			/>
		</div>

		<!-- Payment Method -->
		<select
			bind:value={selectedMethod}
			onchange={applyFilters}
			class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
		>
			<option value="all">Semua Metode</option>
			<option value="Cash">Cash</option>
			<option value="QRIS">QRIS</option>
			<option value="Transfer">Transfer</option>
			<option value="Other">Other</option>
		</select>

		<!-- Custom Date Range (If Selected) -->
		{#if selectedPreset === 'custom'}
			<div class="flex items-center gap-2">
				<input
					type="date"
					bind:value={startDate}
					class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
				<span class="text-slate-500 text-xs">s/d</span>
				<input
					type="date"
					bind:value={endDate}
					class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>
		{/if}

		<button
			type="button"
			onclick={applyFilters}
			class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
		>
			<Filter class="w-3.5 h-3.5 text-emerald-400" />
			<span>Cari</span>
		</button>
	</div>

	<!-- Transactions Table -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
		{#if data.sales.length === 0}
			<div class="p-12 text-center">
				<Receipt class="w-12 h-12 text-slate-600 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-white">Tidak ada transaksi ditemukan</h3>
				<p class="text-xs text-slate-400 mt-1">Coba sesuaikan tanggal filter atau nomor invoice pencarian.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3.5 px-4">Invoice</th>
							<th class="py-3.5 px-4">Tanggal & Waktu</th>
							<th class="py-3.5 px-4 text-center">Jumlah Item</th>
							<th class="py-3.5 px-4 text-right">Total Belanja</th>
							<th class="py-3.5 px-4 text-center">Metode Bayar</th>
							<th class="py-3.5 px-4">Kasir</th>
							<th class="py-3.5 px-4 text-center">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.sales as sale}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4">
									<a
										href="/transactions/{sale.id}"
										class="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
									>
										<span>{sale.invoice_number}</span>
									</a>
								</td>
								<td class="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
									{formatDateTime(sale.created_at)}
								</td>
								<td class="py-3 px-4 text-center font-bold text-slate-300">
									{sale.item_count} jenis
								</td>
								<td class="py-3 px-4 text-right font-mono font-bold text-white">
									{formatRupiah(sale.grand_total)}
								</td>
								<td class="py-3 px-4 text-center">
									<span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
										{sale.payment_method}
									</span>
								</td>
								<td class="py-3 px-4 text-slate-300">
									{sale.created_by}
								</td>
								<td class="py-3 px-4 text-center">
									<div class="flex items-center justify-center gap-1.5">
										<a
											href="/transactions/{sale.id}"
											class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
											title="Lihat & Cetak Invoice"
										>
											<Eye class="w-3.5 h-3.5 text-emerald-400" />
											<span>Detail</span>
										</a>
										<button
											type="button"
											onclick={() => confirmDeleteSale(sale)}
											class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-rose-500/30 transition cursor-pointer"
											title="Hapus Transaksi (Salah Input)"
										>
											<Trash2 class="w-3.5 h-3.5 text-rose-400" />
											<span>Hapus</span>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination Footer -->
			<div class="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
				<span>
					Menampilkan <strong class="text-white">{data.sales.length}</strong> dari <strong class="text-white">{data.total}</strong> transaksi
				</span>
				<div class="flex items-center gap-2">
					<button
						type="button"
						disabled={data.page <= 1}
						onclick={() => changePage(data.page - 1)}
						class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
					>
						<ChevronLeft class="w-4 h-4" />
					</button>
					<span>Halaman <strong class="text-white">{data.page}</strong> dari <strong class="text-white">{data.totalPages}</strong></span>
					<button
						type="button"
						disabled={data.page >= data.totalPages}
						onclick={() => changePage(data.page + 1)}
						class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
					>
						<ChevronRight class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- MODAL KONFIRMASI HAPUS TRANSAKSI (SALAH INPUT) -->
{#if saleToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0" onclick={() => !isDeleting && (saleToDelete = null)}></div>

		<div class="relative w-full max-w-md bg-[#0c1220] border border-rose-500/40 rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-scale-up">
			<!-- Header Modal -->
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
						<AlertTriangle class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-base font-bold text-white">Hapus Transaksi</h3>
						<p class="text-xs text-rose-400 font-medium">Koreksi Transaksi Salah Input</p>
					</div>
				</div>
				<button
					type="button"
					disabled={isDeleting}
					onclick={() => (saleToDelete = null)}
					class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Detail Transaksi yang akan dihapus -->
			<div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
				<div class="flex justify-between items-center pb-2 border-b border-slate-800/80">
					<span class="text-slate-400">Nomor Invoice:</span>
					<span class="font-mono font-bold text-emerald-400">{saleToDelete.invoice_number}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-slate-400">Total Belanja:</span>
					<span class="font-mono font-bold text-white text-sm">{formatRupiah(saleToDelete.grand_total)}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-slate-400">Jumlah Jenis Item:</span>
					<span class="text-slate-200 font-semibold">{saleToDelete.item_count} jenis</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-slate-400">Metode Pembayaran:</span>
					<span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold uppercase text-[10px]">{saleToDelete.payment_method}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-slate-400">Waktu Transaksi:</span>
					<span class="text-slate-300 font-mono text-[11px]">{formatDateTime(saleToDelete.created_at)}</span>
				</div>
			</div>

			<!-- Keterangan Otomatisasi Stok -->
			<div class="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-200/90 space-y-1">
				<p class="font-bold flex items-center gap-1.5 text-rose-300">
					<AlertTriangle class="w-4 h-4 text-rose-400 shrink-0" />
					Perhatian Pengembalian Stok:
				</p>
				<p class="text-[11px] leading-relaxed text-slate-300">
					Semua barang yang terjual pada transaksi ini akan <strong>secara otomatis dikembalikan ke stok toko</strong>, dan pencatatan pendapatan invoice ini akan dibatalkan secara bersih.
				</p>
			</div>

			<!-- Tombol Aksi -->
			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					disabled={isDeleting}
					onclick={() => (saleToDelete = null)}
					class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
				>
					Batal
				</button>
				<button
					type="button"
					disabled={isDeleting}
					onclick={handleDeleteConfirmed}
					class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
				>
					{#if isDeleting}
						<Loader2 class="w-4 h-4 animate-spin" />
						<span>Menghapus...</span>
					{:else}
						<Trash2 class="w-4 h-4" />
						<span>Ya, Hapus & Kembalikan Stok</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

