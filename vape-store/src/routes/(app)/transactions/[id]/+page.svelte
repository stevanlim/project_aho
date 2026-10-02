<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { goto } from '$app/navigation';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import { playSuccessSound } from '$lib/utils/sound.js';
	import {
		Printer,
		ArrowLeft,
		ShoppingCart,
		CheckCircle,
		Store,
		Trash2,
		AlertTriangle,
		Loader2,
		X
	} from 'lucide-svelte';

	let { data } = $props();
	const sale = $derived(data.sale);
	const settings = $derived(data.settings);

	let showDeleteModal = $state(false);
	let isDeleting = $state(false);

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

	async function handleDeleteInvoice() {
		if (isDeleting) return;
		isDeleting = true;

		try {
			const res = await fetch(`/api/sales/${sale.id}`, {
				method: 'DELETE'
			});
			const result = await res.json();

			if (!res.ok || result.error) {
				throw new Error(result.error || 'Gagal menghapus invoice.');
			}

			showToast(`Transaksi ${sale.invoice_number} berhasil dihapus & stok dikembalikan!`, 'success');
			playSuccessSound();

			showDeleteModal = false;
			await goto('/transactions');
		} catch (err: any) {
			console.error('Delete invoice error:', err);
			showToast(err.message || 'Gagal menghapus transaksi.', 'error');
		} finally {
			isDeleting = false;
		}
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

		<div class="flex flex-wrap items-center gap-2.5">
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
				class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
			>
				<Printer class="w-4 h-4" />
				<span>Cetak Invoice</span>
			</button>
			<button
				type="button"
				onclick={() => (showDeleteModal = true)}
				class="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
				title="Hapus Transaksi (Salah Input Barang)"
			>
				<Trash2 class="w-4 h-4 text-rose-400" />
				<span>Hapus Transaksi</span>
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

<!-- MODAL KONFIRMASI HAPUS TRANSAKSI -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0" onclick={() => !isDeleting && (showDeleteModal = false)}></div>

		<div class="relative w-full max-w-md bg-[#0c1220] border border-rose-500/40 rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-scale-up">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
						<AlertTriangle class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-base font-bold text-white">Hapus Invoice {sale.invoice_number}</h3>
						<p class="text-xs text-rose-400 font-medium">Koreksi Transaksi Salah Input</p>
					</div>
				</div>
				<button
					type="button"
					disabled={isDeleting}
					onclick={() => (showDeleteModal = false)}
					class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
				<div class="flex justify-between items-center pb-2 border-b border-slate-800/80">
					<span class="text-slate-400">Total Belanja:</span>
					<span class="font-mono font-bold text-emerald-400 text-sm">{formatRupiah(sale.grand_total)}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-slate-400">Metode Bayar:</span>
					<span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold uppercase text-[10px]">{sale.payment_method}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-slate-400">Kasir:</span>
					<span class="text-slate-200">{sale.created_by}</span>
				</div>
			</div>

			<div class="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-200/90 space-y-1">
				<p class="font-bold flex items-center gap-1.5 text-rose-300">
					<AlertTriangle class="w-4 h-4 text-rose-400 shrink-0" />
					Perhatian Pengembalian Stok:
				</p>
				<p class="text-[11px] leading-relaxed text-slate-300">
					Transaksi ini akan dihapus permanen. Seluruh barang dalam invoice ini akan <strong>secara otomatis dikembalikan ke inventaris stok toko</strong>.
				</p>
			</div>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					disabled={isDeleting}
					onclick={() => (showDeleteModal = false)}
					class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
				>
					Batal
				</button>
				<button
					type="button"
					disabled={isDeleting}
					onclick={handleDeleteInvoice}
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
