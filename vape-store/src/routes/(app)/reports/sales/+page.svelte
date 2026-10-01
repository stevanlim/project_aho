<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		FileSpreadsheet,
		Calendar,
		Filter,
		PackageCheck,
		DollarSign,
		ExternalLink,
		TrendingUp,
		CalendarDays,
		CalendarRange,
		Wallet,
		Receipt,
		Banknote,
		QrCode,
		CreditCard
	} from 'lucide-svelte';

	let { data } = $props();

	let selectedPeriod = $state(data.filters.period);
	let startDate = $state(data.filters.startDate);
	let endDate = $state(data.filters.endDate);

	$effect(() => {
		selectedPeriod = data.filters.period;
		startDate = data.filters.startDate;
		endDate = data.filters.endDate;
	});

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

	const totalItemsQty = $derived(
		data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
	);

	const totalItemsRevenue = $derived(
		data.items.reduce((sum: number, item: any) => sum + item.total, 0)
	);

	const totalDailyRevenue = $derived(
		data.mutations.daily.reduce((sum: number, d: any) => sum + d.totalRevenue, 0)
	);

	const totalDailyCash = $derived(
		data.mutations.daily.reduce((sum: number, d: any) => sum + (d.cashRevenue || 0), 0)
	);

	const totalDailyQris = $derived(
		data.mutations.daily.reduce((sum: number, d: any) => sum + (d.qrisRevenue || 0), 0)
	);

	const totalDailyTransfer = $derived(
		data.mutations.daily.reduce((sum: number, d: any) => sum + (d.transferRevenue || 0), 0)
	);

	const totalDailyProfit = $derived(
		data.mutations.daily.reduce((sum: number, d: any) => sum + d.profit, 0)
	);

	const totalDailyTransactions = $derived(
		data.mutations.daily.reduce((sum: number, d: any) => sum + d.transactionCount, 0)
	);

	const periodPayment = $derived(
		data.mutations.periodPayment || {
			totalRevenue: totalDailyRevenue,
			totalTransactions: totalDailyTransactions,
			cashRevenue: totalDailyCash,
			qrisRevenue: totalDailyQris,
			transferRevenue: totalDailyTransfer,
			cashCount: 0,
			qrisCount: 0,
			transferCount: 0,
			otherRevenue: 0,
			otherCount: 0
		}
	);

	const periodCashPct = $derived(
		periodPayment.totalRevenue > 0
			? Math.round((periodPayment.cashRevenue / periodPayment.totalRevenue) * 100)
			: 0
	);
	const periodQrisPct = $derived(
		periodPayment.totalRevenue > 0
			? Math.round((periodPayment.qrisRevenue / periodPayment.totalRevenue) * 100)
			: 0
	);
	const periodTransferPct = $derived(
		periodPayment.totalRevenue > 0
			? Math.round((periodPayment.transferRevenue / periodPayment.totalRevenue) * 100)
			: 0
	);
</script>

<svelte:head>
	<title>Mutasi Pendapatan {data.userRole === 'kasir' ? '- Kasir' : ''} - SS VAPE</title>
</svelte:head>

<Header title="Mutasi Pendapatan" />

<div class="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold text-white flex items-center gap-2">
				<FileSpreadsheet class="w-5 h-5 text-cyan-400" />
				Mutasi Pendapatan
				{#if data.userRole === 'kasir'}
					<span class="text-xs px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono">
						{data.userName}
					</span>
				{/if}
			</h2>
			<p class="text-xs text-slate-400 mt-0.5">
				Ringkasan pendapatan transaksi toko. Filter: harian, bulanan, tahunan.
			</p>
		</div>

		<!-- Period Selection -->
		<div class="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shrink-0">
			{#each [
				{ id: 'today', label: 'Hari Ini' },
				{ id: 'month', label: 'Bulan Ini' },
				{ id: 'year', label: 'Tahun Ini' },
				{ id: 'custom', label: 'Custom' }
			] as tab}
				<button
					type="button"
					onclick={() => applyPeriod(tab.id)}
					class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer {selectedPeriod === tab.id ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}"
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
					class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
				/>
				<span class="text-xs text-slate-400">Sampai:</span>
				<input
					type="date"
					bind:value={endDate}
					class="bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
				/>
			</div>
			<button
				type="button"
				onclick={applyCustomDate}
				class="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
			>
				Terapkan
			</button>
		</div>
	{/if}

	<!-- 3 Summary Cards: Hari Ini / Bulan Ini / Tahun Ini with Mini Payment Breakdown -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
		<!-- Pendapatan Hari Ini -->
		<div class="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/80 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Pendapatan Hari Ini</span>
				<div class="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
					<CalendarDays class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.mutations.summary.todayRevenue)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1">
				<span class="text-emerald-400 font-semibold">{data.mutations.summary.todayTransactions}</span> transaksi hari ini
			</p>
			<div class="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[10px]">
				<div>
					<span class="text-slate-500 block">Cash:</span>
					<span class="font-mono text-emerald-400 font-semibold">{formatRupiah(data.mutations.summary.todayCash || 0)}</span>
				</div>
				<div>
					<span class="text-slate-500 block">QRIS:</span>
					<span class="font-mono text-cyan-400 font-semibold">{formatRupiah(data.mutations.summary.todayQris || 0)}</span>
				</div>
				<div>
					<span class="text-slate-500 block">Transfer:</span>
					<span class="font-mono text-indigo-400 font-semibold">{formatRupiah(data.mutations.summary.todayTransfer || 0)}</span>
				</div>
			</div>
		</div>

		<!-- Pendapatan Bulan Ini -->
		<div class="bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-cyan-400">Pendapatan Bulan Ini</span>
				<div class="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
					<CalendarRange class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.mutations.summary.monthRevenue)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1">
				<span class="text-cyan-400 font-semibold">{data.mutations.summary.monthTransactions}</span> transaksi bulan ini
			</p>
			<div class="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[10px]">
				<div>
					<span class="text-slate-500 block">Cash:</span>
					<span class="font-mono text-emerald-400 font-semibold">{formatRupiah(data.mutations.summary.monthCash || 0)}</span>
				</div>
				<div>
					<span class="text-slate-500 block">QRIS:</span>
					<span class="font-mono text-cyan-400 font-semibold">{formatRupiah(data.mutations.summary.monthQris || 0)}</span>
				</div>
				<div>
					<span class="text-slate-500 block">Transfer:</span>
					<span class="font-mono text-indigo-400 font-semibold">{formatRupiah(data.mutations.summary.monthTransfer || 0)}</span>
				</div>
			</div>
		</div>

		<!-- Pendapatan Tahun Ini -->
		<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg hover:border-indigo-500/40 transition">
			<div class="flex items-center justify-between text-slate-400 mb-2">
				<span class="text-xs font-bold uppercase tracking-wider text-indigo-400">Pendapatan Tahun Ini</span>
				<div class="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
					<TrendingUp class="w-4 h-4" />
				</div>
			</div>
			<p class="text-2xl font-black text-white font-mono tracking-tight">
				{formatRupiah(data.mutations.summary.yearRevenue)}
			</p>
			<p class="text-[11px] text-slate-400 mt-1">
				<span class="text-indigo-400 font-semibold">{data.mutations.summary.yearTransactions}</span> transaksi tahun ini
			</p>
			<div class="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[10px]">
				<div>
					<span class="text-slate-500 block">Cash:</span>
					<span class="font-mono text-emerald-400 font-semibold">{formatRupiah(data.mutations.summary.yearCash || 0)}</span>
				</div>
				<div>
					<span class="text-slate-500 block">QRIS:</span>
					<span class="font-mono text-cyan-400 font-semibold">{formatRupiah(data.mutations.summary.yearQris || 0)}</span>
				</div>
				<div>
					<span class="text-slate-500 block">Transfer:</span>
					<span class="font-mono text-indigo-400 font-semibold">{formatRupiah(data.mutations.summary.yearTransfer || 0)}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- RINCIAN METODE PEMBAYARAN PERIODE TERPILIH -->
	<div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
			<div>
				<h3 class="font-bold text-white text-sm flex items-center gap-2">
					<Banknote class="w-4 h-4 text-emerald-400" />
					<span>Rincian Pembayaran Periode Terpilih ({data.filters.startDate} s/d {data.filters.endDate})</span>
				</h3>
				<p class="text-xs text-slate-400 mt-0.5">
					Total penerimaan uang kas fisik dan pembayaran digital nontunai pada rentang tanggal ini.
				</p>
			</div>
			<div class="text-xs text-slate-300 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 shrink-0">
				Total Omzet: <strong class="text-white">{formatRupiah(periodPayment.totalRevenue)}</strong> ({periodPayment.totalTransactions} nota)
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
			<!-- Cash -->
			<div class="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
						<Banknote class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Kas Tunai (Cash)</span>
						<p class="text-lg font-black text-white font-mono">{formatRupiah(periodPayment.cashRevenue)}</p>
					</div>
				</div>
				<div class="text-right">
					<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
						{periodCashPct}%
					</span>
					<p class="text-[10px] text-slate-400 mt-1">{periodPayment.cashCount} nota</p>
				</div>
			</div>

			<!-- QRIS -->
			<div class="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
						<QrCode class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">QRIS</span>
						<p class="text-lg font-black text-white font-mono">{formatRupiah(periodPayment.qrisRevenue)}</p>
					</div>
				</div>
				<div class="text-right">
					<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
						{periodQrisPct}%
					</span>
					<p class="text-[10px] text-slate-400 mt-1">{periodPayment.qrisCount} nota</p>
				</div>
			</div>

			<!-- Transfer -->
			<div class="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
						<CreditCard class="w-5 h-5" />
					</div>
					<div>
						<span class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Transfer Bank</span>
						<p class="text-lg font-black text-white font-mono">{formatRupiah(periodPayment.transferRevenue)}</p>
					</div>
				</div>
				<div class="text-right">
					<span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
						{periodTransferPct}%
					</span>
					<p class="text-[10px] text-slate-400 mt-1">{periodPayment.transferCount} nota</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Mutasi Pendapatan Harian Table -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
		<div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
			<h3 class="text-sm font-bold text-white flex items-center gap-2">
				<Wallet class="w-4 h-4 text-emerald-400" />
				Mutasi Pendapatan Per Hari (Rincian Cash, QRIS & Transfer)
			</h3>
			<span class="text-[11px] text-slate-400">
				Periode: {data.filters.startDate} &mdash; {data.filters.endDate}
			</span>
		</div>

		{#if data.mutations.daily.length === 0}
			<div class="p-12 text-center text-slate-500 text-xs">
				<Wallet class="w-12 h-12 text-slate-600 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-white">Belum ada pendapatan</h3>
				<p class="mt-1">Tidak ada transaksi pada periode ini.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3.5 px-4">Tanggal</th>
							<th class="py-3.5 px-4 text-center">Transaksi</th>
							<th class="py-3.5 px-4 text-right">Total Omzet</th>
							<th class="py-3.5 px-4 text-right text-emerald-400">Cash (Tunai)</th>
							<th class="py-3.5 px-4 text-right text-cyan-400">QRIS</th>
							<th class="py-3.5 px-4 text-right text-indigo-400">Transfer</th>
							<th class="py-3.5 px-4 text-right text-slate-400">Modal Keluar</th>
							<th class="py-3.5 px-4 text-right text-emerald-400">Laba Kotor</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.mutations.daily as day}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4 font-mono text-slate-200">
									<span class="font-semibold text-white">{day.label}</span>
								</td>
								<td class="py-3 px-4 text-center">
									<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold font-mono text-[11px] border border-cyan-500/20">
										<Receipt class="w-3 h-3" />
										{day.transactionCount}
									</span>
								</td>
								<td class="py-3 px-4 text-right font-mono font-bold text-white">
									{formatRupiah(day.totalRevenue)}
								</td>
								<td class="py-3 px-4 text-right font-mono font-medium text-emerald-400">
									{formatRupiah(day.cashRevenue || 0)}
								</td>
								<td class="py-3 px-4 text-right font-mono font-medium text-cyan-400">
									{formatRupiah(day.qrisRevenue || 0)}
								</td>
								<td class="py-3 px-4 text-right font-mono font-medium text-indigo-400">
									{formatRupiah(day.transferRevenue || 0)}
								</td>
								<td class="py-3 px-4 text-right font-mono text-slate-400">
									{formatRupiah(day.totalCost)}
								</td>
								<td class="py-3 px-4 text-right font-mono font-bold {day.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
									{formatRupiah(day.profit)}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="bg-slate-950/80 border-t-2 border-slate-800 text-xs font-semibold">
						<tr>
							<td class="py-3 px-4 text-slate-400 font-bold">
								TOTAL ({data.mutations.daily.length} hari)
							</td>
							<td class="py-3 px-4 text-center font-mono font-bold text-cyan-400">
								{totalDailyTransactions}
							</td>
							<td class="py-3 px-4 text-right font-mono font-bold text-white">
								{formatRupiah(totalDailyRevenue)}
							</td>
							<td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">
								{formatRupiah(totalDailyCash)}
							</td>
							<td class="py-3 px-4 text-right font-mono font-bold text-cyan-400">
								{formatRupiah(totalDailyQris)}
							</td>
							<td class="py-3 px-4 text-right font-mono font-bold text-indigo-400">
								{formatRupiah(totalDailyTransfer)}
							</td>
							<td class="py-3 px-4 text-right font-mono text-slate-400">
								{formatRupiah(totalDailyRevenue - totalDailyProfit)}
							</td>
							<td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">
								{formatRupiah(totalDailyProfit)}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>

	<!-- Detail Item Log Table -->
	<div class="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
		<div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
			<h3 class="text-sm font-bold text-white flex items-center gap-2">
				<FileSpreadsheet class="w-4 h-4 text-cyan-400" />
				Detail Barang Terjual
			</h3>
			<div class="flex items-center gap-3 text-[11px]">
				<span class="text-slate-400"><strong class="text-cyan-400">{totalItemsQty}</strong> unit terjual</span>
				<span class="text-slate-600">&bull;</span>
				<span class="text-slate-400">Nilai: <strong class="text-emerald-400">{formatRupiah(totalItemsRevenue)}</strong></span>
			</div>
		</div>

		{#if data.items.length === 0}
			<div class="p-12 text-center text-slate-500 text-xs">
				<FileSpreadsheet class="w-12 h-12 text-slate-600 mx-auto mb-3" />
				<h3 class="text-sm font-bold text-white">Tidak ada mutasi barang terjual</h3>
				<p class="mt-1">Belum ada barang yang terjual pada periode ini.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
							<th class="py-3 px-4">Tanggal Transaksi</th>
							<th class="py-3 px-4">Nama Produk</th>
							<th class="py-3 px-4">Kategori</th>
							<th class="py-3 px-4 text-center">Jumlah</th>
							<th class="py-3 px-4 text-right">Harga Jual</th>
							<th class="py-3 px-4 text-right">Total</th>
							<th class="py-3 px-4">No. Invoice</th>
							<th class="py-3 px-4 text-center">Metode Bayar</th>
							<th class="py-3 px-4">Kasir</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800/60">
						{#each data.items as item}
							<tr class="hover:bg-slate-800/30 transition">
								<td class="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
									{formatDateTime(item.createdAt)}
								</td>
								<td class="py-3 px-4 font-bold text-white">
									{item.productName}
								</td>
								<td class="py-3 px-4">
									<span class="px-2 py-0.5 rounded text-[10px] uppercase font-semibold {item.category === 'device' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : item.category === 'liquid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : item.category === 'coil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : item.category === 'catridge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}">
										{item.category === 'other' ? 'Lainnya' : item.category}
									</span>
								</td>
								<td class="py-3 px-4 text-center font-bold text-cyan-400 font-mono">
									{item.quantity} pcs
								</td>
								<td class="py-3 px-4 text-right font-mono text-slate-400">
									{formatRupiah(item.unitPrice)}
								</td>
								<td class="py-3 px-4 text-right font-mono font-bold text-emerald-400">
									{formatRupiah(item.total)}
								</td>
								<td class="py-3 px-4">
									<span class="font-mono text-[11px] text-slate-300">
										{item.invoiceNumber}
									</span>
								</td>
								<td class="py-3 px-4 text-center">
									<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold {item.paymentMethod === 'Cash' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : item.paymentMethod === 'QRIS' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : item.paymentMethod === 'Transfer' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-300'}">
										{item.paymentMethod || 'Cash'}
									</span>
								</td>
								<td class="py-3 px-4">
									<span class="text-[11px] text-slate-400">{item.createdBy || '-'}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
