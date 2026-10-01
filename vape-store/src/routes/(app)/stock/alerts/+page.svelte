<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		AlertTriangle,
		Printer,
		Search,
		Filter,
		Package,
		Boxes,
		ArrowDownToLine,
		TrendingUp,
		Wallet,
		CheckCircle2,
		XCircle,
		Sparkles,
		Eye,
		ChevronRight,
		FileSpreadsheet,
		RefreshCw,
		Building2,
		Layers
	} from 'lucide-svelte';

	let { data } = $props();

	let selectedCategory = $state(data.filters.category);
	let selectedStatus = $state(data.filters.status); // 'all' | 'out' | 'low'
	let searchQuery = $state(data.filters.search);
	let isPrintPreviewOpen = $state(false);

	$effect(() => {
		selectedCategory = data.filters.category;
		selectedStatus = data.filters.status;
		searchQuery = data.filters.search;
	});

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	function formatDateTime(isoString: string) {
		return new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'full',
			timeStyle: 'medium'
		}).format(new Date(isoString));
	}

	function applyFilters(newCategory?: string, newStatus?: string) {
		const cat = newCategory !== undefined ? newCategory : selectedCategory;
		const stat = newStatus !== undefined ? newStatus : selectedStatus;

		selectedCategory = cat;
		selectedStatus = stat;

		const url = new URL(page.url);
		if (cat && cat !== 'all') url.searchParams.set('category', cat);
		else url.searchParams.delete('category');

		if (stat && stat !== 'all') url.searchParams.set('status', stat);
		else url.searchParams.delete('status');

		if (searchQuery && searchQuery.trim() !== '') url.searchParams.set('search', searchQuery.trim());
		else url.searchParams.delete('search');

		goto(url.toString());
	}

	function handlePrint() {
		window.print();
	}

	// Categories list with readable labels
	const categories = [
		{ id: 'all', label: 'Semua Kategori' },
		{ id: 'device', label: 'Device' },
		{ id: 'liquid', label: 'Liquid' },
		{ id: 'coil', label: 'Coil' },
		{ id: 'catridge', label: 'Catridge' },
		{ id: 'other', label: 'Lainnya' }
	];

	// Derived counts based on currently selected category
	const currentCatData = $derived(
		selectedCategory === 'all'
			? {
					out: data.outOfStockCount,
					low: data.lowStockCount,
					total: data.outOfStockCount + data.lowStockCount
				}
			: data.categoryBreakdown[selectedCategory] || { out: 0, low: 0, total: 0 }
	);

	const reportStatusTitle = $derived(
		selectedStatus === 'out'
			? 'DAFTAR PRODUK HABIS (OUT OF STOCK)'
			: selectedStatus === 'low'
				? `DAFTAR PRODUK MENIPIS (STOK ≤ ${data.lowStockThreshold})`
				: 'DAFTAR PRODUK HABIS & MENIPIS'
	);

	const reportCategoryTitle = $derived(
		selectedCategory === 'all'
			? 'SEMUA KATEGORI'
			: selectedCategory.toUpperCase()
	);
</script>

<svelte:head>
	<title>Laporan Stok Habis & Menipis (Cetak PDF) - SS VAPE</title>
</svelte:head>

<Header title="Laporan & Peringatan Stok" />

<div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full no-print">
	<!-- Top Bar: Title & Action Buttons -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
					<AlertTriangle class="w-4 h-4" />
				</div>
				<h2 class="text-xl font-extrabold text-white">Stok Habis & Menipis</h2>
			</div>
			<p class="text-xs text-slate-400 mt-1">
				Filter barang berdasarkan kategori, pantau produk yang habis atau menipis, dan cetak langsung laporan PDF untuk restock barang.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<!-- Link to Input Stok Masuk -->
			<a
				href="/stock/in"
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs transition cursor-pointer"
			>
				<ArrowDownToLine class="w-3.5 h-3.5 text-emerald-400" />
				<span>Input Stok Masuk</span>
			</a>

			<!-- Toggle Print Preview on Screen -->
			<button
				type="button"
				onclick={() => (isPrintPreviewOpen = !isPrintPreviewOpen)}
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs transition cursor-pointer"
			>
				<Eye class="w-3.5 h-3.5 text-cyan-400" />
				<span>{isPrintPreviewOpen ? 'Tutup Pratinjau' : 'Pratinjau PDF'}</span>
			</button>

			<!-- Primary Print / Export to PDF button -->
			<button
				type="button"
				onclick={handlePrint}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer shrink-0"
			>
				<Printer class="w-4 h-4" />
				<span>Cetak / Export PDF</span>
			</button>
		</div>
	</div>

	<!-- 4 REAL-TIME METRIC CARDS -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
		<!-- 1. Total Habis -->
		<div class="bg-gradient-to-br from-rose-950/40 via-slate-900/80 to-slate-900/80 border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-rose-400">Total Stok Habis (0)</span>
				<div class="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
					<XCircle class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{currentCatData.out} <span class="text-xs font-normal text-slate-400">item</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1 leading-snug">
				{selectedCategory === 'all' ? 'Semua produk' : `Produk ${selectedCategory}`} dengan persediaan kosong (0).
			</p>
		</div>

		<!-- 2. Total Menipis -->
		<div class="bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-900/80 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-amber-400">Stok Menipis (≤ {data.lowStockThreshold})</span>
				<div class="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
					<AlertTriangle class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{currentCatData.low} <span class="text-xs font-normal text-slate-400">item</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1 leading-snug">
				Perlu segera dipesan sebelum kehabisan persediaan di toko.
			</p>
		</div>

		<!-- 3. Total Kebutuhan Unit Restock -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Target Restock Unit</span>
				<div class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
					<Boxes class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{data.totalNeededUnits} <span class="text-xs font-normal text-slate-400">pcs</span>
			</p>
			<p class="text-[11px] text-slate-400 mt-1 leading-snug">
				Estimasi unit agar stok aman (target {data.targetStock} pcs per produk).
			</p>
		</div>

		<!-- 4. Estimasi Biaya Modal Restock -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Estimasi Modal Restock</span>
				<div class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
					<Wallet class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.totalEstimatedRestockCost)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1 leading-snug">
				Perkiraan dana belanja barang untuk seluruh produk yang dipilih.
			</p>
		</div>
	</div>

	<!-- FILTER & SELECTION CONTROLS -->
	<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
		<!-- 1. PILIH KATEGORI (TABS / BUTTONS) -->
		<div>
			<div class="flex items-center justify-between mb-2.5">
				<span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
					<Layers class="w-3.5 h-3.5 text-emerald-400" />
					<span>1. Pilih Kategori Produk:</span>
				</span>
				<span class="text-[11px] text-slate-400">
					Klik kategori untuk memfilter data
				</span>
			</div>

			<div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
				{#each categories as cat}
					{@const catStat = cat.id === 'all'
						? { total: data.outOfStockCount + data.lowStockCount }
						: data.categoryBreakdown[cat.id] || { total: 0 }}
					<button
						type="button"
						onclick={() => applyFilters(cat.id, undefined)}
						class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border {selectedCategory === cat.id
							? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
							: 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60'}"
					>
						<span>{cat.label}</span>
						{#if catStat.total > 0}
							<span
								class="text-[10px] font-mono px-1.5 py-0.2 rounded-full {selectedCategory === cat.id
									? 'bg-emerald-400 text-slate-950 font-bold'
									: 'bg-slate-800 text-slate-300'}"
							>
								{catStat.total}
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<hr class="border-slate-800/80" />

		<!-- 2. PILIH APA YANG HABIS ATAU APA YANG MENIPIS (STATUS TOGGLE) -->
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
			<div class="space-y-2">
				<span class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
					<Filter class="w-3.5 h-3.5 text-cyan-400" />
					<span>2. Pilih Status yang Ingin Dicetak / Ditampilkan:</span>
				</span>
				<div class="flex flex-wrap items-center gap-2">
					<!-- Semua (Habis & Menipis) -->
					<button
						type="button"
						onclick={() => applyFilters(undefined, 'all')}
						class="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-2 {selectedStatus === 'all'
							? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
							: 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}"
					>
						<span>Semua (Habis & Menipis)</span>
						<span class="text-[10px] px-1.5 py-0.2 rounded font-mono {selectedStatus === 'all' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-300'}">
							{currentCatData.out + currentCatData.low}
						</span>
					</button>

					<!-- Hanya Habis (Out of stock) -->
					<button
						type="button"
						onclick={() => applyFilters(undefined, 'out')}
						class="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-2 {selectedStatus === 'out'
							? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
							: 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}"
					>
						<XCircle class="w-3.5 h-3.5 text-rose-400 {selectedStatus === 'out' ? 'text-white' : ''}" />
						<span>Cetak Hanya yang Habis (0)</span>
						<span class="text-[10px] px-1.5 py-0.2 rounded font-mono {selectedStatus === 'out' ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-slate-300'}">
							{currentCatData.out}
						</span>
					</button>

					<!-- Hanya Menipis (Low stock) -->
					<button
						type="button"
						onclick={() => applyFilters(undefined, 'low')}
						class="px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-2 {selectedStatus === 'low'
							? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
							: 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}"
					>
						<AlertTriangle class="w-3.5 h-3.5 text-amber-400 {selectedStatus === 'low' ? 'text-slate-950' : ''}" />
						<span>Cetak Hanya yang Menipis (≤ {data.lowStockThreshold})</span>
						<span class="text-[10px] px-1.5 py-0.2 rounded font-mono {selectedStatus === 'low' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'}">
							{currentCatData.low}
						</span>
					</button>
				</div>
			</div>

			<!-- Search Filter Input -->
			<div class="w-full lg:w-72 relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
					<Search class="w-4 h-4" />
				</div>
				<input
					type="text"
					placeholder="Cari nama atau SKU..."
					bind:value={searchQuery}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					class="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => {
							searchQuery = '';
							applyFilters();
						}}
						class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
					>
						&times;
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- ACTIVE FILTER BANNER / QUICK STATUS BAR -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-300 gap-2">
		<div class="flex items-center gap-2 flex-wrap">
			<span class="text-slate-400">Menampilkan:</span>
			<span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
				Kategori: {reportCategoryTitle}
			</span>
			<span class="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
				Filter: {reportStatusTitle}
			</span>
			<span class="text-slate-400">
				(Ditemukan <strong class="text-white">{data.products.length}</strong> produk)
			</span>
		</div>

		<!-- Direct Print Shortcut -->
		<button
			type="button"
			onclick={handlePrint}
			class="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer shrink-0"
		>
			<Printer class="w-3.5 h-3.5" />
			<span>Cetak PDF ({data.products.length} produk) &rarr;</span>
		</button>
	</div>

	<!-- TABLE PREVIEW ON SCREEN -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
		{#if data.products.length === 0}
			<div class="p-12 text-center">
				<CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-white">Stok Dalam Kondisi Aman!</h3>
				<p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
					Tidak ada produk yang habis atau menipis pada kategori dan filter yang Anda pilih. Semua produk memiliki stok di atas batas minimum.
				</p>
				<button
					type="button"
					onclick={() => applyFilters('all', 'all')}
					class="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
				>
					Tampilkan Semua Kategori
				</button>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3 px-4 w-12 text-center">No</th>
							<th class="py-3 px-4">Produk</th>
							<th class="py-3 px-4">Kategori & Spesifikasi</th>
							<th class="py-3 px-4 text-center">Sisa Stok</th>
							<th class="py-3 px-4 text-center">Status</th>
							<th class="py-3 px-4 text-right">Modal Satuan</th>
							<th class="py-3 px-4 text-center">Saran Restock</th>
							<th class="py-3 px-4 text-right bg-emerald-950/20 text-emerald-400 border-x border-emerald-900/30">
								Estimasi Biaya
							</th>
							<th class="py-3 px-4 text-center">Aksi Cepat</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.products as prod, index}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4 text-center text-slate-400 font-mono">
									{index + 1}
								</td>

								<!-- Produk info & SKU -->
								<td class="py-3 px-4">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center shrink-0">
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

								<!-- Kategori & Detail -->
								<td class="py-3 px-4">
									<div class="space-y-0.5">
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

								<!-- Sisa Stok -->
								<td class="py-3 px-4 text-center">
									<span class="font-bold font-mono text-base {prod.isOut ? 'text-rose-400' : 'text-amber-400'}">
										{prod.stock}
									</span>
									<span class="text-[10px] text-slate-400 ml-0.5">{prod.unit}</span>
								</td>

								<!-- Status Badge -->
								<td class="py-3 px-4 text-center">
									{#if prod.isOut}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
											<span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
											<span>Habis</span>
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
											<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
											<span>Menipis</span>
										</span>
									{/if}
								</td>

								<!-- Modal Satuan -->
								<td class="py-3 px-4 text-right font-mono text-slate-300">
									{formatRupiah(prod.purchase_price)}
								</td>

								<!-- Saran Restock Qty -->
								<td class="py-3 px-4 text-center">
									<div class="inline-flex items-center gap-1 font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
										<span>+{prod.neededQty}</span>
										<span class="text-[10px] font-normal text-slate-400">{prod.unit}</span>
									</div>
								</td>

								<!-- Estimasi Biaya Restock -->
								<td class="py-3 px-4 text-right font-mono font-bold text-emerald-400 bg-emerald-950/15 border-x border-emerald-900/20">
									{formatRupiah(prod.estimatedModal)}
								</td>

								<!-- Aksi Cepat Input Stok -->
								<td class="py-3 px-4 text-center">
									<a
										href="/stock/in"
										class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition text-[11px] font-semibold cursor-pointer"
										title="Buka form stok masuk untuk menambah stok barang ini"
									>
										<ArrowDownToLine class="w-3 h-3" />
										<span>Restock</span>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>

					<!-- Footer Summary Row -->
					<tfoot class="bg-slate-950/80 border-t-2 border-slate-800 text-xs font-semibold">
						<tr>
							<td colspan="6" class="py-3 px-4 text-slate-400 text-right">
								Total Kebutuhan Restock ({data.products.length} item produk):
							</td>
							<td class="py-3 px-4 text-center font-mono font-bold text-cyan-300">
								+{data.totalNeededUnits} unit
							</td>
							<td class="py-3 px-4 text-right font-mono font-black text-emerald-400 bg-emerald-950/30 border-x border-emerald-900/30">
								{formatRupiah(data.totalEstimatedRestockCost)}
							</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>

	<!-- SCREEN PREVIEW ACCORDION (If user clicked "Pratinjau PDF") -->
	{#if isPrintPreviewOpen}
		<div class="mt-8 border-t-2 border-dashed border-slate-800 pt-6 animate-fade-in">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Eye class="w-4 h-4 text-cyan-400" />
					<h3 class="text-sm font-bold text-white">Tinjauan Format Cetak PDF Dokumen A4</h3>
				</div>
				<button
					type="button"
					onclick={handlePrint}
					class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer flex items-center gap-1.5"
				>
					<Printer class="w-3.5 h-3.5" />
					<span>Cetak Sekarang</span>
				</button>
			</div>

			<div class="bg-slate-800/40 p-4 sm:p-6 rounded-2xl border border-slate-700/60 overflow-x-auto">
				<!-- Mockup Document Wrapper -->
				<div class="bg-white text-slate-900 rounded-lg p-8 max-w-4xl mx-auto shadow-2xl space-y-5 font-sans">
					<!-- Mini Header -->
					<div class="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
						<div>
							<h1 class="text-xl font-black tracking-tight">{data.settings.store_name || 'SS VAPE'}</h1>
							<p class="text-xs text-slate-600">{data.settings.address || 'Teluk Batang'}</p>
							<p class="text-xs text-slate-600">Telp/WA: {data.settings.phone || '-'}</p>
						</div>
						<div class="text-right text-xs">
							<span class="inline-block px-2 py-0.5 bg-slate-900 text-white font-bold rounded text-[10px] uppercase">
								Restock Request
							</span>
							<p class="text-slate-500 mt-1">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
						</div>
					</div>

					<div class="text-center py-1">
						<h2 class="text-base font-extrabold tracking-wide uppercase">{reportStatusTitle}</h2>
						<p class="text-xs text-slate-600 font-medium">Kategori: {reportCategoryTitle}</p>
					</div>

					<div class="text-[11px] text-slate-600 flex justify-between bg-slate-100 p-2.5 rounded border border-slate-200">
						<span>Total Habis: <strong>{currentCatData.out} item</strong></span>
						<span>Total Menipis: <strong>{currentCatData.low} item</strong></span>
						<span>Target Unit: <strong>+{data.totalNeededUnits} pcs</strong></span>
						<span>Estimasi Dana: <strong>{formatRupiah(data.totalEstimatedRestockCost)}</strong></span>
					</div>

					<!-- Mini Table -->
					<table class="w-full text-left text-[11px] border border-slate-300 border-collapse">
						<thead>
							<tr class="bg-slate-100 text-slate-700 border-b border-slate-300">
								<th class="p-1.5 text-center w-8 border-r border-slate-300">No</th>
								<th class="p-1.5 border-r border-slate-300">SKU</th>
								<th class="p-1.5 border-r border-slate-300">Nama Produk</th>
								<th class="p-1.5 text-center border-r border-slate-300">Kategori</th>
								<th class="p-1.5 text-center border-r border-slate-300">Sisa</th>
								<th class="p-1.5 text-center border-r border-slate-300">Status</th>
								<th class="p-1.5 text-right border-r border-slate-300">Harga Modal</th>
								<th class="p-1.5 text-center border-r border-slate-300">Rekomendasi</th>
								<th class="p-1.5 text-right">Estimasi Modal</th>
							</tr>
						</thead>
						<tbody>
							{#each data.products.slice(0, 8) as prod, i}
								<tr class="border-b border-slate-200">
									<td class="p-1.5 text-center border-r border-slate-200">{i + 1}</td>
									<td class="p-1.5 font-mono text-[10px] border-r border-slate-200">{prod.sku}</td>
									<td class="p-1.5 font-semibold border-r border-slate-200">{prod.name}</td>
									<td class="p-1.5 text-center capitalize border-r border-slate-200">{prod.category}</td>
									<td class="p-1.5 text-center font-bold border-r border-slate-200">{prod.stock}</td>
									<td class="p-1.5 text-center font-bold text-[10px] border-r border-slate-200 {prod.isOut ? 'text-rose-600' : 'text-amber-600'}">
										{prod.isOut ? 'HABIS' : 'MENIPIS'}
									</td>
									<td class="p-1.5 text-right font-mono border-r border-slate-200">{formatRupiah(prod.purchase_price)}</td>
									<td class="p-1.5 text-center font-bold border-r border-slate-200">+{prod.neededQty}</td>
									<td class="p-1.5 text-right font-mono font-semibold">{formatRupiah(prod.estimatedModal)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if data.products.length > 8}
						<p class="text-[10px] text-slate-500 italic text-center">
							... dan {data.products.length - 8} produk lainnya akan tercetak lengkap pada dokumen PDF penuh.
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- ========================================================================= -->
<!-- DEDICATED OFFICIAL PRINTABLE AREA (Only printed on window.print() / PDF)   -->
<!-- ========================================================================= -->
<div class="print-only hidden font-sans text-black bg-white p-2">
	<!-- Official Store Letterhead (Kop Surat) -->
	<div class="border-b-2 border-black pb-3 mb-4">
		<div class="flex items-start justify-between">
			<div class="space-y-1">
				<h1 class="text-xl font-black uppercase tracking-tight text-black">
					{data.settings.store_name || 'SS VAPE'}
				</h1>
				<p class="text-xs text-gray-700">
					{data.settings.address || 'Kecamatan Teluk Batang, Kabupaten Kayong Utara'}
				</p>
				<p class="text-xs text-gray-700">
					Telepon / WhatsApp: <strong>{data.settings.phone || '0812-3456-7890'}</strong>
				</p>
			</div>
			<div class="text-right space-y-1">
				<div class="inline-block border border-black px-3 py-1 font-bold text-xs uppercase tracking-wider">
					DOKUMEN RESTOCK
				</div>
				<p class="text-[10px] text-gray-600">
					Dicetak: {formatDateTime(data.printedAt)}
				</p>
				<p class="text-[10px] text-gray-600">
					Petugas: <strong>{data.printedBy}</strong>
				</p>
			</div>
		</div>
	</div>

	<!-- Document Title & Filter Criteria -->
	<div class="text-center mb-4 space-y-1">
		<h2 class="text-base font-extrabold uppercase tracking-wide underline underline-offset-4">
			{reportStatusTitle}
		</h2>
		<p class="text-xs text-gray-700 font-semibold">
			KATEGORI: {reportCategoryTitle}
		</p>
		<p class="text-[11px] text-gray-500">
			Daftar kebutuhan persediaan barang untuk pemesanan ulang (Purchase Order / Restock List).
		</p>
	</div>

	<!-- Summary Boxes for Quick Evaluation -->
	<div class="grid grid-cols-4 gap-2 mb-4 text-center">
		<div class="border border-black p-2 bg-gray-50">
			<span class="block text-[9px] uppercase font-bold text-gray-600">Total Produk Habis</span>
			<strong class="text-sm font-black">{currentCatData.out} item</strong>
		</div>
		<div class="border border-black p-2 bg-gray-50">
			<span class="block text-[9px] uppercase font-bold text-gray-600">Total Produk Menipis</span>
			<strong class="text-sm font-black">{currentCatData.low} item</strong>
		</div>
		<div class="border border-black p-2 bg-gray-50">
			<span class="block text-[9px] uppercase font-bold text-gray-600">Target Restock Unit</span>
			<strong class="text-sm font-black">+{data.totalNeededUnits} pcs</strong>
		</div>
		<div class="border border-black p-2 bg-gray-50">
			<span class="block text-[9px] uppercase font-bold text-gray-600">Estimasi Modal Restock</span>
			<strong class="text-sm font-black">{formatRupiah(data.totalEstimatedRestockCost)}</strong>
		</div>
	</div>

	<!-- Official PDF Table -->
	<table class="w-full text-left text-[11px] border border-black border-collapse mb-6">
		<thead>
			<tr class="bg-gray-100 text-black border-b border-black font-bold uppercase text-[10px]">
				<th class="p-1.5 text-center w-8 border-r border-black">No</th>
				<th class="p-1.5 w-24 border-r border-black">Kode SKU</th>
				<th class="p-1.5 border-r border-black">Nama Produk & Spesifikasi</th>
				<th class="p-1.5 text-center w-20 border-r border-black">Kategori</th>
				<th class="p-1.5 text-center w-16 border-r border-black">Sisa Stok</th>
				<th class="p-1.5 text-center w-20 border-r border-black">Status</th>
				<th class="p-1.5 text-right w-24 border-r border-black">Modal Satuan</th>
				<th class="p-1.5 text-center w-20 border-r border-black">Restock Target</th>
				<th class="p-1.5 text-right w-28">Subtotal Modal</th>
			</tr>
		</thead>
		<tbody>
			{#each data.products as prod, index}
				<tr class="border-b border-gray-400 break-inside-avoid {index % 2 === 1 ? 'bg-gray-50' : ''}">
					<td class="p-1.5 text-center border-r border-gray-400 font-mono text-[10px]">
						{index + 1}
					</td>
					<td class="p-1.5 border-r border-gray-400 font-mono text-[10px]">
						{prod.sku}
					</td>
					<td class="p-1.5 border-r border-gray-400">
						<span class="font-bold text-black">{prod.name}</span>
						{#if prod.category === 'liquid' && (prod.liquid_type || prod.nicotine_mg || prod.volume_ml)}
							<span class="block text-[9px] text-gray-600">
								{prod.liquid_type || ''} • {prod.nicotine_mg || 0}mg • {prod.volume_ml || 0}ml
							</span>
						{:else if prod.category === 'catridge' && prod.resistance_ohm}
							<span class="block text-[9px] text-gray-600">Ohm: {prod.resistance_ohm}</span>
						{/if}
					</td>
					<td class="p-1.5 text-center capitalize border-r border-gray-400 text-[10px]">
						{prod.category === 'other' ? 'Lainnya' : prod.category}
					</td>
					<td class="p-1.5 text-center font-bold font-mono border-r border-gray-400">
						{prod.stock} {prod.unit}
					</td>
					<td class="p-1.5 text-center border-r border-gray-400 font-black text-[9px]">
						{prod.isOut ? 'HABIS (0)' : 'MENIPIS'}
					</td>
					<td class="p-1.5 text-right font-mono border-r border-gray-400">
						{formatRupiah(prod.purchase_price)}
					</td>
					<td class="p-1.5 text-center font-bold font-mono border-r border-gray-400">
						+{prod.neededQty} {prod.unit}
					</td>
					<td class="p-1.5 text-right font-mono font-bold">
						{formatRupiah(prod.estimatedModal)}
					</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr class="bg-gray-100 border-t-2 border-black font-bold">
				<td colspan="7" class="p-2 text-right uppercase text-[10px] border-r border-black">
					TOTAL ESTIMASI KEBUTUHAN RESTOCK ({data.products.length} ITEM):
				</td>
				<td class="p-2 text-center font-mono font-bold border-r border-black">
					+{data.totalNeededUnits} unit
				</td>
				<td class="p-2 text-right font-mono font-black text-xs">
					{formatRupiah(data.totalEstimatedRestockCost)}
				</td>
			</tr>
		</tfoot>
	</table>

	<!-- Signatures & Notes Block -->
	<div class="break-inside-avoid mt-6">
		<div class="flex justify-between items-start text-xs pt-4 border-t border-gray-300">
			<!-- Left Signature: Dibuat Oleh -->
			<div class="text-center w-52 space-y-16">
				<p class="font-semibold text-gray-700">Dibuat Oleh (Admin/Kasir):</p>
				<div class="border-b border-black w-40 mx-auto"></div>
				<p class="font-bold text-black">{data.printedBy}</p>
			</div>

			<!-- Center Note -->
			<div class="max-w-xs text-[10px] text-gray-500 italic text-center space-y-1 self-center">
				<p>Dokumen ini adalah data resmi inventaris SS VAPE untuk pengajuan restock barang.</p>
				<p>{data.settings.invoice_footer || 'Terima kasih atas kerja samanya.'}</p>
			</div>

			<!-- Right Signature: Disetujui Oleh -->
			<div class="text-center w-52 space-y-16">
				<p class="font-semibold text-gray-700">Disetujui Oleh (Owner/Manajer):</p>
				<div class="border-b border-black w-40 mx-auto"></div>
				<p class="font-bold text-black">Pemilik Toko</p>
			</div>
		</div>
	</div>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}

		.no-print {
			display: none !important;
		}

		.print-only {
			display: block !important;
		}

		table {
			page-break-inside: auto;
		}

		tr {
			page-break-inside: avoid;
			page-break-after: auto;
		}

		thead {
			display: table-header-group;
		}

		tfoot {
			display: table-footer-group;
		}

		@page {
			size: A4 portrait;
			margin: 10mm 12mm;
		}
	}
</style>
