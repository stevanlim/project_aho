<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		History,
		Filter,
		Calendar,
		ArrowDownLeft,
		ArrowUpRight,
		SlidersHorizontal,
		ChevronLeft,
		ChevronRight,
		Package
	} from 'lucide-svelte';

	let { data } = $props();

	let selectedType = $state(data.filters.type);
	let startDate = $state(data.filters.startDate);
	let endDate = $state(data.filters.endDate);

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
		if (selectedType && selectedType !== 'all') url.searchParams.set('type', selectedType);
		else url.searchParams.delete('type');

		if (startDate) url.searchParams.set('startDate', startDate);
		else url.searchParams.delete('startDate');

		if (endDate) url.searchParams.set('endDate', endDate);
		else url.searchParams.delete('endDate');

		url.searchParams.set('page', '1');
		goto(url.toString());
	}

	function changePage(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(newPage));
		goto(url.toString());
	}
</script>

<svelte:head>
	<title>Mutasi Stok Inventori - SS VAPE</title>
</svelte:head>

<Header title="Riwayat Mutasi Stok" />

<div class="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold text-white flex items-center gap-2">
				<History class="w-5 h-5 text-cyan-400" />
				Log Mutasi Inventori
			</h2>
			<p class="text-xs text-slate-400 mt-0.5">Seluruh pergerakan barang masuk (IN), penjualan kasir (OUT), dan penyesuaian stok.</p>
		</div>
		<a
			href="/stock/in"
			class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
		>
			<span>+ Catat Barang Masuk</span>
		</a>
	</div>

	<!-- Filter Controls -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-md flex flex-wrap items-center gap-3">
		<!-- Type Filter -->
		<select
			bind:value={selectedType}
			onchange={applyFilters}
			class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
		>
			<option value="all">Semua Jenis Mutasi</option>
			<option value="IN">IN (Barang Masuk)</option>
			<option value="OUT">OUT (Penjualan / Keluar)</option>
			<option value="ADJUSTMENT">ADJUSTMENT (Penyesuaian)</option>
		</select>

		<!-- Date Range Inputs -->
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

		<button
			type="button"
			onclick={applyFilters}
			class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
		>
			<Filter class="w-3.5 h-3.5 text-cyan-400" />
			<span>Filter</span>
		</button>
	</div>

	<!-- Mutations Table -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
		{#if data.mutations.length === 0}
			<div class="p-12 text-center">
				<History class="w-12 h-12 text-slate-600 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-white">Tidak ada mutasi stok</h3>
				<p class="text-xs text-slate-400 mt-1">Belum ada catatan mutasi stok untuk periode atau filter ini.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3.5 px-4">Waktu</th>
							<th class="py-3.5 px-4">Produk</th>
							<th class="py-3.5 px-4">Jenis Mutasi</th>
							<th class="py-3.5 px-4 text-center">Perubahan Jumlah</th>
							<th class="py-3.5 px-4 text-right">Harga Modal</th>
							<th class="py-3.5 px-4">Catatan / Ref</th>
							<th class="py-3.5 px-4">Dicatat Oleh</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.mutations as mut}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
									{formatDateTime(mut.created_at)}
								</td>
								<td class="py-3 px-4">
									<div>
										<p class="font-bold text-white">{mut.product_name}</p>
										<div class="flex items-center gap-2 mt-0.5">
											<span class="text-[10px] font-mono text-emerald-400">{mut.product_sku}</span>
											<span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
												{mut.product_category}
											</span>
										</div>
									</div>
								</td>
								<td class="py-3 px-4">
									{#if mut.type === 'IN'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
											<ArrowDownLeft class="w-3 h-3" />
											<span>IN</span>
										</span>
									{:else if mut.type === 'OUT'}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
											<ArrowUpRight class="w-3 h-3" />
											<span>OUT</span>
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
											<SlidersHorizontal class="w-3 h-3" />
											<span>ADJUSTMENT</span>
										</span>
									{/if}
								</td>
								<td class="py-3 px-4 text-center font-mono font-bold text-sm">
									{#if mut.type === 'IN'}
										<span class="text-emerald-400">+{mut.quantity}</span>
									{:else if mut.type === 'OUT'}
										<span class="text-rose-400">-{mut.quantity}</span>
									{:else}
										<span class={mut.quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
											{mut.quantity > 0 ? `+${mut.quantity}` : mut.quantity}
										</span>
									{/if}
								</td>
								<td class="py-3 px-4 text-right font-mono text-slate-400">
									{formatRupiah(mut.purchase_price)}
								</td>
								<td class="py-3 px-4 text-slate-300 max-w-xs truncate">
									{mut.note || mut.reference_id || '-'}
								</td>
								<td class="py-3 px-4 text-slate-400 text-[11px]">
									{mut.created_by}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination Footer -->
			<div class="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
				<span>
					Menampilkan <strong class="text-white">{data.mutations.length}</strong> dari <strong class="text-white">{data.total}</strong> mutasi
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
