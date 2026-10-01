<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import {
		DollarSign,
		ShoppingCart,
		Package,
		AlertTriangle,
		XCircle,
		ArrowUpRight,
		PlusCircle,
		Boxes,
		TrendingUp,
		Flame,
		Sparkles
	} from 'lucide-svelte';

	let { data } = $props();

	const isAdmin = $derived(data.userRole === 'admin');
	const isKasir = $derived(data.userRole === 'kasir');

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	const maxRevenue = $derived(
		Math.max(...data.dailyChart.map((d: any) => d.revenue), 100000)
	);

	const totalCategoryQty = $derived(
		data.categorySales.reduce((acc: number, curr: any) => acc + curr.total_quantity, 0)
	);
</script>

<svelte:head>
	<title>Dashboard - SS VAPE</title>
</svelte:head>

<Header title="Dashboard Ringkasan" />

<div class="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
	<!-- Welcome Banner with Action Buttons -->
	<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-slate-900 border border-emerald-500/20 p-6 lg:p-8 shadow-2xl">
		<div class="absolute -right-10 -top-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
		<div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div>
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full {isKasir ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'} border text-xs font-semibold mb-3">
					<Sparkles class="w-3.5 h-3.5" />
					<span>{isKasir ? 'Panel Kasir' : 'Sistem Kasir & Manajemen Stok'}</span>
				</div>
				<h2 class="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
					{#if isKasir}
						Halo, <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">{data.userName}</span>
					{:else}
						Selamat Datang di <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">SS VAPE</span>
					{/if}
				</h2>
				<p class="text-sm text-slate-400 mt-1 max-w-xl">
					{#if isKasir}
						Mulai layani pelanggan melalui Kasir POS dan pantau pendapatan Anda hari ini.
					{:else}
						Pantau performa penjualan harian, pergerakan mutasi stok barang vape, dan operasional kasir secara akurat.
					{/if}
				</p>
			</div>

			<!-- Quick Actions -->
			<div class="flex flex-wrap items-center gap-3">
				<a
					href="/pos"
					class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
				>
					<ShoppingCart class="w-4 h-4" />
					<span>Buka Kasir POS</span>
				</a>
				{#if isAdmin}
					<a
						href="/products/new"
						class="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700/80 transition flex items-center gap-2 active:scale-95 cursor-pointer"
					>
						<PlusCircle class="w-4 h-4 text-emerald-400" />
						<span>Tambah Produk</span>
					</a>
					<a
						href="/stock/in"
						class="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700/80 transition flex items-center gap-2 active:scale-95 cursor-pointer"
					>
						<Boxes class="w-4 h-4 text-cyan-400" />
						<span>Barang Masuk</span>
					</a>
				{:else}
					<a
						href="/reports/sales"
						class="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700/80 transition flex items-center gap-2 active:scale-95 cursor-pointer"
					>
						<TrendingUp class="w-4 h-4 text-cyan-400" />
						<span>Mutasi Pendapatan</span>
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Summary Statistic Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- 1. Pendapatan Hari Ini -->
		<div class="bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition duration-200">
			<div class="flex items-center justify-between text-slate-400 mb-3">
				<span class="text-xs font-semibold uppercase tracking-wider">Pendapatan Hari Ini</span>
				<div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
					<DollarSign class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{formatRupiah(data.stats.todayRevenue)}</p>
			<p class="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
				<span class="font-bold text-emerald-400">{data.stats.todaySalesCount}</span> transaksi hari ini
			</p>
		</div>

		<!-- 2. Pendapatan Bulan Ini -->
		<div class="bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition duration-200">
			<div class="flex items-center justify-between text-slate-400 mb-3">
				<span class="text-xs font-semibold uppercase tracking-wider">Pendapatan Bulan Ini</span>
				<div class="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
					<TrendingUp class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{formatRupiah(data.stats.monthRevenue)}</p>
			<p class="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
				<span class="font-bold text-cyan-400">{data.stats.monthSalesCount}</span> transaksi bulan ini
			</p>
		</div>

		{#if isAdmin}
			<!-- 3. Total Produk Aktif (ADMIN ONLY) -->
			<div class="bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition duration-200">
				<div class="flex items-center justify-between text-slate-400 mb-3">
					<span class="text-xs font-semibold uppercase tracking-wider">Total Produk</span>
					<div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
						<Package class="w-4 h-4" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{data.stats.totalProducts}</p>
				<p class="text-xs text-slate-400 mt-2">Item terdaftar aktif dalam katalog</p>
			</div>

			<!-- 4. Peringatan Stok (ADMIN ONLY) -->
			<div class="bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition duration-200">
				<div class="flex items-center justify-between text-slate-400 mb-3">
					<span class="text-xs font-semibold uppercase tracking-wider">Status Inventori</span>
					<div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
						<AlertTriangle class="w-4 h-4" />
					</div>
				</div>
				<div class="flex items-center gap-4">
					<a href="/stock/alerts?status=low" class="group/item hover:opacity-80 transition cursor-pointer">
						<span class="text-xl font-black text-amber-400">{data.stats.lowStockCount}</span>
						<p class="text-[11px] text-slate-400 group-hover/item:text-amber-300">Menipis (≤ {data.settings.low_stock_threshold})</p>
					</a>
					<div class="w-px h-8 bg-slate-800"></div>
					<a href="/stock/alerts?status=out" class="group/item hover:opacity-80 transition cursor-pointer">
						<span class="text-xl font-black text-rose-400">{data.stats.outOfStockCount}</span>
						<p class="text-[11px] text-slate-400 group-hover/item:text-rose-300">Habis (0)</p>
					</a>
				</div>
				<div class="mt-2 flex items-center justify-between">
					<a href="/stock/alerts" class="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
						<span>Lihat & Cetak PDF Stok</span>
						<ArrowUpRight class="w-3 h-3" />
					</a>
				</div>
			</div>
		{:else}
			<!-- Kasir: Pendapatan Tahun Ini -->
			<div class="bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/40 transition duration-200">
				<div class="flex items-center justify-between text-slate-400 mb-3">
					<span class="text-xs font-semibold uppercase tracking-wider">Pendapatan Tahun Ini</span>
					<div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
						<TrendingUp class="w-4 h-4" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{formatRupiah(data.revenueSummary?.yearRevenue || 0)}</p>
				<p class="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
					<span class="font-bold text-indigo-400">{data.revenueSummary?.yearTransactions || 0}</span> transaksi tahun ini
				</p>
			</div>

			<!-- Kasir: Transaksi Toko Hari Ini (semua kasir) -->
			<div class="bg-slate-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition duration-200">
				<div class="flex items-center justify-between text-slate-400 mb-3">
					<span class="text-xs font-semibold uppercase tracking-wider">Transaksi Toko Hari Ini</span>
					<div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
						<ShoppingCart class="w-4 h-4" />
					</div>
				</div>
				<p class="text-2xl font-black text-white">{data.stats.todaySalesCount}</p>
				<p class="text-xs text-slate-400 mt-2">Total transaksi seluruh kasir hari ini</p>
			</div>
		{/if}
	</div>

	<!-- Main Charts & Analytics Row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: 7 Days Sales Trend Chart -->
		<div class="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
			<div class="flex items-center justify-between mb-6">
				<div>
					<h3 class="font-bold text-white text-base">Tren Penjualan 7 Hari Terakhir</h3>
					<p class="text-xs text-slate-400 mt-0.5">Grafik pendapatan dan transaksi harian</p>
				</div>
				<div class="flex items-center gap-4 text-xs font-semibold">
					<div class="flex items-center gap-1.5 text-emerald-400">
						<span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
						<span>Pendapatan</span>
					</div>
				</div>
			</div>

			<!-- Responsive Bar Chart -->
			<div class="h-64 flex items-end gap-3 pt-6 pb-2 px-2">
				{#each data.dailyChart as day}
					{@const heightPercent = Math.min(100, Math.max(10, Math.round((day.revenue / maxRevenue) * 100)))}
					<div class="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
						<!-- Tooltip on hover -->
						<div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 border border-slate-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-20">
							<p class="font-bold text-emerald-400">{formatRupiah(day.revenue)}</p>
							<p class="text-[10px] text-slate-400">{day.count} Transaksi</p>
						</div>

						<!-- Revenue Bar -->
						<div class="w-full max-w-[42px] bg-slate-800/80 rounded-t-lg relative overflow-hidden flex flex-col justify-end" style="height: {heightPercent}%;">
							<div class="w-full h-full bg-gradient-to-t from-emerald-600 to-cyan-400 opacity-80 group-hover:opacity-100 transition rounded-t-lg"></div>
						</div>

						<!-- Day Label -->
						<span class="text-[11px] text-slate-400 font-medium tracking-tight truncate w-full text-center">
							{day.label}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right: Category Sales Breakdown -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col">
			<h3 class="font-bold text-white text-base mb-1">Penjualan per Kategori</h3>
			<p class="text-xs text-slate-400 mb-6">Distribusi produk vape yang terjual</p>

			<div class="flex-1 flex flex-col justify-center space-y-4">
				{#if data.categorySales.length === 0}
					<div class="text-center py-8 text-slate-500 text-xs">
						Belum ada transaksi penjualan yang tercatat.
					</div>
				{:else}
					{#each data.categorySales as cat}
						{@const percentage = totalCategoryQty > 0 ? Math.round((cat.total_quantity / totalCategoryQty) * 100) : 0}
						<div class="space-y-1.5">
							<div class="flex items-center justify-between text-xs">
								<span class="font-bold uppercase tracking-wider text-slate-200">{cat.category === 'other' ? 'Lainnya' : cat.category}</span>
								<div class="flex items-center gap-2">
									<span class="text-slate-400">{cat.total_quantity} pcs</span>
									<span class="font-bold text-emerald-400">{percentage}%</span>
								</div>
							</div>
							<div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {cat.category === 'device' ? 'bg-emerald-500' : cat.category === 'liquid' ? 'bg-cyan-500' : cat.category === 'coil' ? 'bg-indigo-500' : cat.category === 'catridge' ? 'bg-amber-500' : 'bg-purple-500'}"
									style="width: {percentage}%;"
								></div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Bottom Row: Top Selling Products Leaderboard -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-2.5">
				<div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
					<Flame class="w-4 h-4 text-emerald-400" />
				</div>
				<h3 class="font-bold text-white text-base">Produk Paling Sering Terjual</h3>
			</div>
			{#if isAdmin}
				<a href="/reports" class="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1">
					<span>Lihat Semua Laporan</span>
					<ArrowUpRight class="w-3 h-3" />
				</a>
			{/if}
		</div>

		{#if data.topProducts.length === 0}
			<div class="text-center py-8 text-slate-500 text-xs">
				Belum ada produk terjual. Lakukan transaksi di kasir POS untuk melihat statistik.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3 px-4">Ranking</th>
							<th class="py-3 px-4">Nama Produk</th>
							<th class="py-3 px-4">Kategori</th>
							<th class="py-3 px-4 text-right">Terjual</th>
							<th class="py-3 px-4 text-right">Total Nilai Penjualan</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.topProducts as prod, idx}
							<tr class="hover:bg-slate-800/40 transition">
								<td class="py-3 px-4 font-bold text-slate-400">
									<span class="inline-flex items-center justify-center w-6 h-6 rounded-lg {idx === 0 ? 'bg-amber-500/20 text-amber-400 font-black' : idx === 1 ? 'bg-slate-700 text-slate-200' : idx === 2 ? 'bg-amber-900/30 text-amber-600' : 'text-slate-500'}">
										#{idx + 1}
									</span>
								</td>
								<td class="py-3 px-4 font-bold text-white">{prod.name}</td>
								<td class="py-3 px-4">
									<span class="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase {prod.category === 'device' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : prod.category === 'liquid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : prod.category === 'coil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : prod.category === 'catridge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}">
										{prod.category === 'other' ? 'Lainnya' : prod.category}
									</span>
								</td>
								<td class="py-3 px-4 text-right font-bold text-emerald-400">{prod.quantity} pcs</td>
								<td class="py-3 px-4 text-right font-bold text-white">{formatRupiah(prod.revenue)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
