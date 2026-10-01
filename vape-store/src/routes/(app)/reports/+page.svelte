<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		TrendingUp,
		DollarSign,
		ShoppingCart,
		PackageCheck,
		Wallet,
		PieChart,
		Calendar,
		Filter,
		Layers,
		Banknote,
		QrCode,
		CreditCard,
		Receipt
	} from 'lucide-svelte';

	let { data } = $props();
	const report = $derived(data.report);

	let selectedPeriod = $state(data.filters.period);
	let startDate = $state(data.filters.startDate);
	let endDate = $state(data.filters.endDate);

	$effect(() => {
		selectedPeriod = data.filters.period;
		startDate = data.filters.startDate;
		endDate = data.filters.endDate;
	});

	const paymentBreakdown = $derived(
		report.paymentBreakdown || {
			cash: { total: 0, count: 0 },
			qris: { total: 0, count: 0 },
			transfer: { total: 0, count: 0 },
			other: { total: 0, count: 0 }
		}
	);

	const cashPct = $derived(
		report.totalRevenue > 0 ? Math.round((paymentBreakdown.cash.total / report.totalRevenue) * 100) : 0
	);
	const qrisPct = $derived(
		report.totalRevenue > 0 ? Math.round((paymentBreakdown.qris.total / report.totalRevenue) * 100) : 0
	);
	const transferPct = $derived(
		report.totalRevenue > 0 ? Math.round((paymentBreakdown.transfer.total / report.totalRevenue) * 100) : 0
	);
	const otherPct = $derived(
		report.totalRevenue > 0 ? Math.round((paymentBreakdown.other.total / report.totalRevenue) * 100) : 0
	);

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	function applyPeriod(p: string) {
		selectedPeriod = p;
		const url = new URL(page.url);
		url.searchParams.set('period', p);
		if (p !== 'custom') {
			url.searchParams.delete('startDate');
			url.searchParams.delete('endDate');
		}
		goto(url.toString());
	}

	function applyCustomDate() {
		const url = new URL(page.url);
		url.searchParams.set('period', 'custom');
		if (startDate) url.searchParams.set('startDate', startDate);
		if (endDate) url.searchParams.set('endDate', endDate);
		goto(url.toString());
	}
</script>

<svelte:head>
	<title>Laporan Pendapatan & Laba - SS VAPE</title>
</svelte:head>

<Header title="Laporan Pendapatan & Laba Kotor" />

<div class="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
	<!-- Period Selection Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold text-white flex items-center gap-2">
				<TrendingUp class="w-5 h-5 text-emerald-400" />
				Kinerja Finansial & Profitabilitas
			</h2>
			<p class="text-xs text-slate-400 mt-0.5">Analisis pendapatan kotor, beban modal (HPP), dan estimasi laba kotor per kategori.</p>
		</div>

		<!-- Period Tabs -->
		<div class="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
			{#each [
				{ id: 'today', label: 'Hari Ini' },
				{ id: 'week', label: 'Minggu Ini' },
				{ id: 'month', label: 'Bulan Ini' },
				{ id: 'year', label: 'Tahun Ini' },
				{ id: 'custom', label: 'Custom' }
			] as tab}
				<button
					type="button"
					onclick={() => applyPeriod(tab.id)}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer {selectedPeriod === tab.id ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Custom Date Form (if custom) -->
	{#if selectedPeriod === 'custom'}
		<div class="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3">
			<div class="flex items-center gap-2">
				<span class="text-xs text-slate-400">Dari:</span>
				<input
					type="date"
					bind:value={startDate}
					class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
				<span class="text-xs text-slate-400">Sampai:</span>
				<input
					type="date"
					bind:value={endDate}
					class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>
			<button
				type="button"
				onclick={applyCustomDate}
				class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
			>
				Terapkan Tanggal
			</button>
		</div>
	{/if}

	<!-- 5 Financial Overview Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
		<!-- Total Transaksi -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-[11px] font-semibold uppercase tracking-wider">Total Transaksi</span>
				<ShoppingCart class="w-4 h-4 text-slate-400" />
			</div>
			<p class="text-2xl font-black text-white">{report.totalTransactions}</p>
			<p class="text-[11px] text-slate-500 mt-1">Struk nota berhasil</p>
		</div>

		<!-- Total Item Terjual -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-[11px] font-semibold uppercase tracking-wider">Item Terjual</span>
				<PackageCheck class="w-4 h-4 text-cyan-400" />
			</div>
			<p class="text-2xl font-black text-cyan-400">{report.totalItemsSold} <span class="text-xs font-normal text-slate-400">pcs</span></p>
			<p class="text-[11px] text-slate-500 mt-1">Total unit barang</p>
		</div>

		<!-- Total Pendapatan (Revenue) -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-[11px] font-semibold uppercase tracking-wider">Total Pendapatan</span>
				<DollarSign class="w-4 h-4 text-emerald-400" />
			</div>
			<p class="text-xl font-black text-white">{formatRupiah(report.totalRevenue)}</p>
			<p class="text-[11px] text-slate-500 mt-1">Gross Omzet penjualan</p>
		</div>

		<!-- Total Modal (HPP) -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-[11px] font-semibold uppercase tracking-wider">Total Modal (HPP)</span>
				<Wallet class="w-4 h-4 text-amber-400" />
			</div>
			<p class="text-xl font-black text-slate-300">{formatRupiah(report.totalCost)}</p>
			<p class="text-[11px] text-slate-500 mt-1">Biaya modal barang</p>
		</div>

		<!-- Laba Kotor (Gross Profit) -->
		<div class="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg shadow-emerald-950/40 sm:col-span-2 lg:col-span-1">
			<div class="flex items-center justify-between text-emerald-400 mb-2">
				<span class="text-[11px] font-bold uppercase tracking-wider">Estimasi Laba Kotor</span>
				<TrendingUp class="w-4 h-4" />
			</div>
			<p class="text-xl font-black text-emerald-400">{formatRupiah(report.grossProfit)}</p>
			<p class="text-[11px] text-emerald-400/70 mt-1">Pendapatan - Modal (HPP)</p>
		</div>
	</div>

	<!-- METODE PENERIMAAN PEMBAYARAN (CASH, QRIS, TRANSFER) -->
	<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<div>
				<h3 class="font-extrabold text-white text-base flex items-center gap-2">
					<Banknote class="w-5 h-5 text-emerald-400" />
					<span>Rincian Hasil Pembayaran: Cash, QRIS & Transfer</span>
				</h3>
				<p class="text-xs text-slate-400 mt-0.5">
					Total penerimaan uang kas fisik dan pembayaran digital nontunai pada periode yang dipilih.
				</p>
			</div>
			<div class="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
				Total Transaksi: <strong class="text-white">{report.totalTransactions}</strong>
			</div>
		</div>

		<!-- 3 PAYMENT METHOD CARDS -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- 1. CASH / TUNAI -->
			<div class="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
				<div class="flex items-center justify-between text-slate-400 mb-2">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
							<Banknote class="w-4 h-4" />
						</div>
						<span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Kas Tunai (Cash)</span>
					</div>
					<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
						{cashPct}% Omzet
					</span>
				</div>
				<p class="text-2xl font-black text-white font-mono tracking-tight mt-3">
					{formatRupiah(paymentBreakdown.cash.total)}
				</p>
				<div class="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
					<span>Frekuensi Transaksi:</span>
					<strong class="text-emerald-400 font-mono">{paymentBreakdown.cash.count} nota</strong>
				</div>
				<p class="text-[10px] text-slate-500 mt-1 italic">
					Uang kas fisik di laci mesin kasir toko
				</p>
			</div>

			<!-- 2. QRIS -->
			<div class="bg-gradient-to-br from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
				<div class="flex items-center justify-between text-slate-400 mb-2">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
							<QrCode class="w-4 h-4" />
						</div>
						<span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Pembayaran QRIS</span>
					</div>
					<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
						{qrisPct}% Omzet
					</span>
				</div>
				<p class="text-2xl font-black text-white font-mono tracking-tight mt-3">
					{formatRupiah(paymentBreakdown.qris.total)}
				</p>
				<div class="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
					<span>Frekuensi Transaksi:</span>
					<strong class="text-cyan-400 font-mono">{paymentBreakdown.qris.count} nota</strong>
				</div>
				<p class="text-[10px] text-slate-500 mt-1 italic">
					Settlement QRIS barcode e-wallet & mobile banking
				</p>
			</div>

			<!-- 3. TRANSFER BANK -->
			<div class="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-500/40 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
				<div class="flex items-center justify-between text-slate-400 mb-2">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
							<CreditCard class="w-4 h-4" />
						</div>
						<span class="text-xs font-bold uppercase tracking-wider text-indigo-400">Transfer Bank</span>
					</div>
					<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
						{transferPct}% Omzet
					</span>
				</div>
				<p class="text-2xl font-black text-white font-mono tracking-tight mt-3">
					{formatRupiah(paymentBreakdown.transfer.total)}
				</p>
				<div class="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
					<span>Frekuensi Transaksi:</span>
					<strong class="text-indigo-400 font-mono">{paymentBreakdown.transfer.count} nota</strong>
				</div>
				<p class="text-[10px] text-slate-500 mt-1 italic">
					Masuk langsung ke rekening bank SS VAPE
				</p>
			</div>
		</div>

		<!-- VISUAL DISTRIBUTION PROGRESS BAR -->
		{#if report.totalRevenue > 0}
			<div class="space-y-2 pt-1">
				<div class="flex items-center justify-between text-[11px] text-slate-400">
					<span>Komposisi Metode Pembayaran:</span>
					<span>Total Omzet: <strong class="text-white">{formatRupiah(report.totalRevenue)}</strong></span>
				</div>
				<div class="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
					{#if cashPct > 0}
						<div
							style="width: {cashPct}%"
							class="h-full bg-emerald-500 transition-all duration-500"
							title="Cash: {formatRupiah(paymentBreakdown.cash.total)} ({cashPct}%)"
						></div>
					{/if}
					{#if qrisPct > 0}
						<div
							style="width: {qrisPct}%"
							class="h-full bg-cyan-500 transition-all duration-500"
							title="QRIS: {formatRupiah(paymentBreakdown.qris.total)} ({qrisPct}%)"
						></div>
					{/if}
					{#if transferPct > 0}
						<div
							style="width: {transferPct}%"
							class="h-full bg-indigo-500 transition-all duration-500"
							title="Transfer: {formatRupiah(paymentBreakdown.transfer.total)} ({transferPct}%)"
						></div>
					{/if}
					{#if otherPct > 0}
						<div
							style="width: {otherPct}%"
							class="h-full bg-purple-500 transition-all duration-500"
							title="Lainnya: {formatRupiah(paymentBreakdown.other.total)} ({otherPct}%)"
						></div>
					{/if}
				</div>
				<div class="flex flex-wrap items-center gap-4 text-[11px] pt-1">
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
						<span class="text-slate-300">Cash: <strong>{cashPct}%</strong> ({formatRupiah(paymentBreakdown.cash.total)})</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
						<span class="text-slate-300">QRIS: <strong>{qrisPct}%</strong> ({formatRupiah(paymentBreakdown.qris.total)})</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
						<span class="text-slate-300">Transfer: <strong>{transferPct}%</strong> ({formatRupiah(paymentBreakdown.transfer.total)})</span>
					</div>
					{#if paymentBreakdown.other.total > 0}
						<div class="flex items-center gap-1.5">
							<span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
							<span class="text-slate-300">Lainnya: <strong>{otherPct}%</strong> ({formatRupiah(paymentBreakdown.other.total)})</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Category Performance Breakdown -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="font-bold text-white text-base flex items-center gap-2">
				<Layers class="w-4 h-4 text-emerald-400" />
				Breakdown Kinerja Finansial per Kategori
			</h3>
			<span class="text-xs text-slate-400 font-mono">Device • Liquid • Coil • Catridge • Lainnya</span>
		</div>

		{#if report.categoryBreakdown.length === 0}
			<div class="p-8 text-center text-slate-500 text-xs">
				Belum ada data transaksi pada periode ini.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs font-mono">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider">
							<th class="py-3 px-4">Kategori</th>
							<th class="py-3 px-4 text-center">Unit Terjual</th>
							<th class="py-3 px-4 text-right">Pendapatan</th>
							<th class="py-3 px-4 text-right">Total Modal (HPP)</th>
							<th class="py-3 px-4 text-right font-bold text-emerald-400">Laba Kotor</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each report.categoryBreakdown as cat}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4">
									<span class="px-2 py-0.5 rounded-md font-bold uppercase text-[11px] {cat.category === 'device' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : cat.category === 'liquid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : cat.category === 'coil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : cat.category === 'catridge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}">
										{cat.category === 'other' ? 'Lainnya' : cat.category}
									</span>
								</td>
								<td class="py-3 px-4 text-center font-bold text-white">{cat.quantity} pcs</td>
								<td class="py-3 px-4 text-right text-slate-300">{formatRupiah(cat.revenue)}</td>
								<td class="py-3 px-4 text-right text-slate-400">{formatRupiah(cat.cost)}</td>
								<td class="py-3 px-4 text-right font-bold text-emerald-400">{formatRupiah(cat.profit)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Top Products in Selected Period -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-lg space-y-4">
		<h3 class="font-bold text-white text-base">Produk Paling Laris pada Periode Ini</h3>
		{#if report.topProducts.length === 0}
			<div class="p-8 text-center text-slate-500 text-xs">
				Belum ada data produk terjual pada periode ini.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3 px-4">Nama Produk</th>
							<th class="py-3 px-4">Kategori</th>
							<th class="py-3 px-4 text-center">Terjual</th>
							<th class="py-3 px-4 text-right">Pendapatan</th>
							<th class="py-3 px-4 text-right">Laba Kotor</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each report.topProducts as prod}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4 font-bold text-white">{prod.name}</td>
								<td class="py-3 px-4">
									<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
										{prod.category}
									</span>
								</td>
								<td class="py-3 px-4 text-center font-bold text-cyan-400 font-mono">{prod.quantity} pcs</td>
								<td class="py-3 px-4 text-right font-mono text-white">{formatRupiah(prod.revenue)}</td>
								<td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatRupiah(prod.profit)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
