<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { Printer, ArrowLeft, ShoppingCart, CheckCircle, Store } from 'lucide-svelte';

	let { data } = $props();
	const sale = $derived(data.sale);
	const settings = $derived(data.settings);

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

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>Invoice {sale.invoice_number} - SS VAPE</title>
</svelte:head>

<Header title="Detail Invoice" />

<div class="p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6">
	<!-- Actions Bar (Hidden on Print) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
		<a
			href="/transactions"
			class="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
		>
			<ArrowLeft class="w-4 h-4" />
			<span>Kembali ke Riwayat</span>
		</a>

		<div class="flex items-center gap-3">
			<a
				href="/pos"
				class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
			>
				<ShoppingCart class="w-3.5 h-3.5 text-emerald-400" />
				<span>Kasir POS</span>
			</a>
			<button
				type="button"
				onclick={handlePrint}
				class="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
			>
				<Printer class="w-4 h-4" />
				<span>Cetak Invoice / Struk</span>
			</button>
		</div>
	</div>

	<!-- Printable Receipt Container -->
	<div class="printable-area bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-200">
		<!-- Store Branding Header -->
		<div class="text-center pb-6 border-b border-dashed border-slate-700">
			<h1 class="text-2xl font-black tracking-widest text-white uppercase">{settings.store_name || 'SS VAPE'}</h1>
			{#if settings.address}
				<p class="text-xs text-slate-400 mt-1">{settings.address}</p>
			{/if}
			{#if settings.phone}
				<p class="text-xs text-slate-400">Telp: {settings.phone}</p>
			{/if}
		</div>

		<!-- Invoice Metadata -->
		<div class="py-4 border-b border-dashed border-slate-700 text-xs space-y-1 font-mono">
			<div class="flex justify-between">
				<span class="text-slate-400">No. Invoice:</span>
				<span class="font-bold text-white">{sale.invoice_number}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-slate-400">Tanggal:</span>
				<span class="text-white">{formatDateTime(sale.created_at)}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-slate-400">Kasir:</span>
				<span class="text-white">{sale.created_by}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-slate-400">Pembayaran:</span>
				<span class="font-bold text-emerald-400">{sale.payment_method}</span>
			</div>
		</div>

		<!-- Items Table -->
		<div class="py-4 border-b border-dashed border-slate-700">
			<table class="w-full text-xs font-mono">
				<thead>
					<tr class="text-slate-400 text-left border-b border-slate-800 pb-2">
						<th class="py-1.5 font-bold">Item</th>
						<th class="py-1.5 text-center font-bold">Qty</th>
						<th class="py-1.5 text-right font-bold">Harga</th>
						<th class="py-1.5 text-right font-bold">Total</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-800/40">
					{#each sale.items || [] as item}
						<tr>
							<td class="py-2 pr-2">
								<p class="font-bold text-white">{item.product_name}</p>
							</td>
							<td class="py-2 text-center text-slate-300">{item.quantity}</td>
							<td class="py-2 text-right text-slate-400">{formatRupiah(item.unit_price)}</td>
							<td class="py-2 text-right font-bold text-white">{formatRupiah(item.subtotal)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Financial Summary -->
		<div class="py-4 border-b border-dashed border-slate-700 text-xs font-mono space-y-1.5">
			<div class="flex justify-between text-slate-400">
				<span>Subtotal:</span>
				<span class="text-white">{formatRupiah(sale.subtotal)}</span>
			</div>
			{#if sale.discount > 0}
				<div class="flex justify-between text-slate-400">
					<span>Diskon:</span>
					<span class="text-rose-400 font-bold">-{formatRupiah(sale.discount)}</span>
				</div>
			{/if}
			<div class="flex justify-between text-sm font-bold pt-1 border-t border-slate-800 text-white">
				<span>TOTAL:</span>
				<span class="text-emerald-400 text-base">{formatRupiah(sale.grand_total)}</span>
			</div>
			<div class="flex justify-between text-slate-400 pt-1">
				<span>Uang Dibayar:</span>
				<span class="text-white">{formatRupiah(sale.paid_amount)}</span>
			</div>
			<div class="flex justify-between text-slate-400">
				<span>Kembalian:</span>
				<span class="font-bold text-cyan-400">{formatRupiah(sale.change_amount)}</span>
			</div>
		</div>

		<!-- Footer Note -->
		<div class="pt-6 text-center text-xs text-slate-400 space-y-1">
			<p class="font-semibold text-slate-300">{settings.invoice_footer || 'Terima kasih telah berbelanja di SS VAPE'}</p>
			<p class="text-[11px] text-slate-500">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
		</div>
	</div>
</div>

<style>
	@media print {
		:global(body) {
			background: white !important;
			color: black !important;
		}

		.printable-area {
			background: white !important;
			color: black !important;
			border: none !important;
			box-shadow: none !important;
			padding: 0 !important;
			max-width: 80mm !important;
			margin: 0 auto !important;
		}

		.printable-area * {
			color: black !important;
			border-color: #333 !important;
		}
	}
</style>
