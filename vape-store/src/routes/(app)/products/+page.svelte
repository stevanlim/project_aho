<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import {
		Plus,
		Search,
		Filter,
		Edit3,
		Trash2,
		AlertTriangle,
		EyeOff,
		CheckCircle,
		Package,
		ChevronLeft,
		ChevronRight,
		SlidersHorizontal,
		Coins,
		TrendingUp,
		Sparkles,
		Boxes,
		Wallet,
		Printer
	} from 'lucide-svelte';

	let { data, form } = $props();

	let searchQuery = $state(data.filters.search);
	let selectedCategory = $state(data.filters.category);
	let selectedStatus = $state(data.filters.status);
	let selectedStockStatus = $state(data.filters.stockStatus || 'all');
	let selectedSort = $state(data.filters.sortBy);

	$effect(() => {
		searchQuery = data.filters.search;
		selectedCategory = data.filters.category;
		selectedStatus = data.filters.status;
		selectedStockStatus = data.filters.stockStatus || 'all';
		selectedSort = data.filters.sortBy;
	});

	// Confirmation modal state
	let deleteModalOpen = $state(false);
	let productToDelete = $state<{ id: number; name: string } | null>(null);

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	// Page-level subtotal modal calculation
	const pageCapitalSubtotal = $derived(
		data.products.reduce((acc, p) => acc + Number(p.purchase_price) * Number(p.stock), 0)
	);
	const pageRetailSubtotal = $derived(
		data.products.reduce((acc, p) => acc + Number(p.selling_price) * Number(p.stock), 0)
	);

	function applyFilters() {
		const url = new URL(page.url);
		if (searchQuery) url.searchParams.set('search', searchQuery);
		else url.searchParams.delete('search');

		if (selectedCategory && selectedCategory !== 'all') url.searchParams.set('category', selectedCategory);
		else url.searchParams.delete('category');

		if (selectedStatus && selectedStatus !== 'all') url.searchParams.set('status', selectedStatus);
		else url.searchParams.delete('status');

		if (selectedStockStatus && selectedStockStatus !== 'all') url.searchParams.set('stockStatus', selectedStockStatus);
		else url.searchParams.delete('stockStatus');

		if (selectedSort) url.searchParams.set('sortBy', selectedSort);

		url.searchParams.set('page', '1');
		goto(url.toString());
	}

	function changePage(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(newPage));
		goto(url.toString());
	}

	function openDeleteModal(prod: { id: number; name: string }) {
		productToDelete = prod;
		deleteModalOpen = true;
	}

	$effect(() => {
		if (form?.success && form?.message) {
			showToast(form.message, 'success');
		} else if (form?.error) {
			showToast(form.error, 'error');
		}
	});
</script>

<svelte:head>
	<title>Katalog Produk & Total Modal - SS VAPE</title>
</svelte:head>

<Header title="Manajemen Produk" />

<div class="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full">
	<!-- Top Bar: Title & Action Buttons -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-extrabold text-white">Daftar Produk Vape & Total Modal</h2>
			<p class="text-xs text-slate-400 mt-0.5">
				Kelola katalog produk, pantau total modal yang dikeluarkan, dan nilai aset sisa stok secara real-time.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2.5">
			<a
				href="/stock/alerts{selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}"
				class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-bold text-xs shadow-md transition cursor-pointer shrink-0"
				title="Lihat produk habis & menipis dan cetak laporan PDF"
			>
				<Printer class="w-4 h-4 text-amber-400" />
				<span>Cetak PDF Habis/Menipis</span>
			</a>
			<a
				href="/products/new"
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer shrink-0"
			>
				<Plus class="w-4 h-4" />
				<span>Tambah Produk Baru</span>
			</a>
		</div>
	</div>

	<!-- 4 REAL-TIME INVENTORY CAPITAL & ASSET VALUATION STAT CARDS -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
		<!-- 1. Total Modal Tersisa (Aset Stok Real-time) -->
		<div class="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/80 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Modal Sisa</span>
				<div class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
					<Wallet class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.overallStats.totalCapital)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1.5 leading-snug">
				Total dana modal pada sisa stok barang saat ini. Otomatis berkurang setiap kali kasir melakukan penjualan.
			</p>
		</div>

		<!-- 2. Estimasi Nilai Jual (Potensi Omset) -->
		<div class="bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden group">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Estimasi Nilai Jual</span>
				<div class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
					<TrendingUp class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.overallStats.totalRetailValue)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1.5 leading-snug">
				Potensi omset penerimaan kas jika seluruh sisa stok barang yang ada berhasil terjual habis.
			</p>
		</div>

		<!-- 3. Potensi Keuntungan Bersih -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-indigo-400">Potensi Keuntungan</span>
				<div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
					<Sparkles class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.overallStats.totalEstimatedProfit)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1.5 leading-snug">
				Margin laba kotor sisa barang: selisih dari nilai jual dikurangi modal yang telah dikeluarkan.
			</p>
		</div>

		<!-- 4. Total Fisik Unit Stok -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-amber-400">Total Fisik Stok</span>
				<div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
					<Boxes class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{data.overallStats.totalStockQty} <span class="text-xs font-normal text-slate-400">unit</span>
			</p>
			<div class="flex items-center gap-2 mt-1.5 text-[11px]">
				<span class="text-emerald-400 font-semibold">{data.overallStats.activeProductsCount} aktif</span>
				<span class="text-slate-600">&bull;</span>
				<a href="/stock/alerts?status=low" class="text-amber-400 hover:text-amber-300 font-semibold hover:underline flex items-center gap-0.5">
					<span>{data.overallStats.lowStockCount} menipis</span>
				</a>
				<span class="text-slate-600">&bull;</span>
				<a href="/stock/alerts?status=out" class="text-rose-400 hover:text-rose-300 font-semibold hover:underline flex items-center gap-0.5">
					<span>{data.overallStats.outOfStockCount} habis</span>
				</a>
			</div>
		</div>
	</div>

	<!-- Search & Filter Controls -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-3">
		<!-- Search Input -->
		<div class="flex-1 relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
				<Search class="w-4 h-4" />
			</div>
			<input
				type="text"
				placeholder="Cari nama produk atau SKU..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
			/>
		</div>

		<!-- Category Filter -->
		<select
			bind:value={selectedCategory}
			onchange={applyFilters}
			class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
		>
			<option value="all">Semua Kategori</option>
			<option value="device">Device</option>
			<option value="liquid">Liquid</option>
			<option value="coil">Coil</option>
			<option value="catridge">Catridge</option>
			<option value="other">Lainnya</option>
		</select>

		<!-- Stock Condition Filter -->
		<select
			bind:value={selectedStockStatus}
			onchange={applyFilters}
			class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
		>
			<option value="all">Semua Stok</option>
			<option value="out">Stok Habis (0)</option>
			<option value="low">Stok Menipis (≤ {data.lowStockThreshold})</option>
			<option value="low_or_out">Habis & Menipis</option>
		</select>

		<!-- Status Filter -->
		<select
			bind:value={selectedStatus}
			onchange={applyFilters}
			class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
		>
			<option value="all">Semua Status</option>
			<option value="active">Aktif</option>
			<option value="inactive">Nonaktif</option>
		</select>

		<!-- Sort By -->
		<select
			bind:value={selectedSort}
			onchange={applyFilters}
			class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
		>
			<option value="created_at">Urutkan: Terbaru</option>
			<option value="name">Urutkan: Nama (A-Z)</option>
			<option value="stock">Urutkan: Stok</option>
			<option value="selling_price">Urutkan: Harga Jual</option>
		</select>

		<button
			type="button"
			onclick={applyFilters}
			class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
		>
			<Filter class="w-3.5 h-3.5 text-emerald-400" />
			<span>Terapkan</span>
		</button>
	</div>

	<!-- Products Table with TOTAL MODAL SISA Column -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
		{#if data.products.length === 0}
			<div class="p-12 text-center">
				<Package class="w-12 h-12 text-slate-600 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-white">Tidak ada produk ditemukan</h3>
				<p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
					Coba ubah kata kunci pencarian atau filter yang Anda gunakan.
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3.5 px-4">Produk</th>
							<th class="py-3.5 px-4">Kategori & Spesifikasi</th>
							<th class="py-3.5 px-4 text-right">Modal Satuan</th>
							<th class="py-3.5 px-4 text-center">Sisa Stok</th>
							<th class="py-3.5 px-4 text-right bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-900/30">
								Total Modal Sisa
							</th>
							<th class="py-3.5 px-4 text-right">Harga Jual</th>
							<th class="py-3.5 px-4 text-center">Status</th>
							<th class="py-3.5 px-4 text-center">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.products as prod}
							{@const itemCapitalTotal = Number(prod.purchase_price) * Number(prod.stock)}
							<tr class="hover:bg-slate-800/30 transition">
								<!-- Product Info & Photo -->
								<td class="py-3 px-4">
									<div class="flex items-center gap-3">
										<div class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0">
											{#if prod.photo}
												<img src={prod.photo} alt={prod.name} class="w-full h-full object-cover" />
											{:else}
												<Package class="w-5 h-5 text-slate-500" />
											{/if}
										</div>
										<div class="min-w-0">
											<p class="font-bold text-white truncate max-w-xs">{prod.name}</p>
											<span class="inline-block text-[11px] font-mono text-emerald-400 font-medium">{prod.sku}</span>
										</div>
									</div>
								</td>

								<!-- Category & Specs -->
								<td class="py-3 px-4">
									<div class="space-y-1">
										<span class="inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase {prod.category === 'device' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : prod.category === 'liquid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : prod.category === 'coil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : prod.category === 'catridge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}">
											{prod.category === 'other' ? 'Lainnya' : prod.category}
										</span>
										{#if prod.category === 'liquid'}
											<p class="text-[11px] text-slate-400">
												{prod.liquid_type || 'Liquid'} • {prod.nicotine_mg || 0}mg • {prod.volume_ml || 0}ml
											</p>
										{:else if prod.category === 'catridge'}
											<p class="text-[11px] text-slate-400">
												Ohm: {prod.resistance_ohm || '-'}
											</p>
										{/if}
									</div>
								</td>

								<!-- Modal Satuan (Purchase Price) -->
								<td class="py-3 px-4 text-right text-slate-300 font-mono">
									{formatRupiah(prod.purchase_price)}
								</td>

								<!-- Stock & Indicator Badge -->
								<td class="py-3 px-4 text-center">
									<div class="inline-flex flex-col items-center">
										<span class="font-bold font-mono text-sm {prod.stock <= 0 ? 'text-rose-400' : prod.stock <= data.lowStockThreshold ? 'text-amber-400' : 'text-emerald-400'}">
											{prod.stock} <span class="text-[10px] font-normal text-slate-400">{prod.unit}</span>
										</span>
										{#if prod.stock <= 0}
											<span class="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold mt-0.5">Habis</span>
										{:else if prod.stock <= data.lowStockThreshold}
											<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold mt-0.5">Menipis</span>
										{:else}
											<span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold mt-0.5">Tersedia</span>
										{/if}
									</div>
								</td>

								<!-- TOTAL MODAL SISA REAL-TIME (Modal Satuan x Sisa Stok) -->
								<td class="py-3 px-4 text-right font-mono bg-emerald-950/15 border-x border-emerald-900/20">
									<p class="font-bold text-sm {itemCapitalTotal > 0 ? 'text-emerald-400' : 'text-slate-500'}">
										{formatRupiah(itemCapitalTotal)}
									</p>
									<p class="text-[10px] text-slate-500">
										{prod.stock} × {formatRupiah(prod.purchase_price)}
									</p>
								</td>

								<!-- Selling Price -->
								<td class="py-3 px-4 text-right font-bold text-white font-mono">
									{formatRupiah(prod.selling_price)}
								</td>

								<!-- Status Badge -->
								<td class="py-3 px-4 text-center">
									<form method="POST" action="?/toggleStatus" use:enhance>
										<input type="hidden" name="id" value={prod.id} />
										<input type="hidden" name="currentStatus" value={prod.status} />
										<button
											type="submit"
											class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition cursor-pointer {prod.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}"
											title="Klik untuk mengubah status produk"
										>
											{prod.status === 'active' ? 'Aktif' : 'Nonaktif'}
										</button>
									</form>
								</td>

								<!-- Actions -->
								<td class="py-3 px-4 text-center">
									<div class="flex items-center justify-center gap-1.5">
										<a
											href="/products/{prod.id}/edit"
											class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
											title="Edit Produk"
										>
											<Edit3 class="w-3.5 h-3.5" />
										</a>
										<button
											type="button"
											onclick={() => openDeleteModal({ id: prod.id, name: prod.name })}
											class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
											title="Hapus Produk"
										>
											<Trash2 class="w-3.5 h-3.5" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>

					<!-- Footer Summary Row for Current Page -->
					<tfoot class="bg-slate-950/80 border-t-2 border-slate-800 text-xs font-semibold">
						<tr>
							<td colspan="4" class="py-3 px-4 text-slate-400 text-right">
								Subtotal Halaman Ini ({data.products.length} item):
							</td>
							<td class="py-3 px-4 text-right font-mono font-bold text-emerald-400 bg-emerald-950/30 border-x border-emerald-900/30">
								{formatRupiah(pageCapitalSubtotal)}
							</td>
							<td class="py-3 px-4 text-right font-mono text-white">
								{formatRupiah(pageRetailSubtotal)}
							</td>
							<td colspan="2"></td>
						</tr>
					</tfoot>
				</table>
			</div>

			<!-- Pagination Footer -->
			<div class="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
				<span>
					Menampilkan <strong class="text-white">{data.products.length}</strong> dari <strong class="text-white">{data.total}</strong> total produk
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

<!-- Confirmation Dialog for Delete / Soft Delete -->
{#if deleteModalOpen && productToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
		<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
					<AlertTriangle class="w-5 h-5" />
				</div>
				<div>
					<h3 class="font-bold text-white text-base">Hapus atau Nonaktifkan?</h3>
					<p class="text-xs text-slate-400">Konfirmasi tindakan pada katalog</p>
				</div>
			</div>

			<p class="text-xs text-slate-300 leading-relaxed">
				Apakah Anda yakin ingin menghapus produk <strong class="text-white">"{productToDelete.name}"</strong>?
				<br /><br />
				<span class="text-slate-400">Catatan: Jika produk sudah pernah memiliki riwayat transaksi di kasir POS, sistem akan secara otomatis menonaktifkan status produk (soft delete) untuk menjaga integritas data penjualan.</span>
			</p>

			<div class="flex items-center justify-end gap-2 pt-2">
				<button
					type="button"
					onclick={() => (deleteModalOpen = false)}
					class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
				>
					Batal
				</button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						deleteModalOpen = false;
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={productToDelete.id} />
					<button
						type="submit"
						class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
					>
						Ya, Hapus/Nonaktifkan
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
