<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import { soundEnabled, toggleSound, playSuccessSound, playWarningSound, playAlertSound } from '$lib/utils/sound.js';
	import type { Product, ProductCategory, PaymentMethod } from '$lib/types/index.js';
	import {
		Search,
		ShoppingCart,
		Trash2,
		Plus,
		Minus,
		CreditCard,
		CheckCircle2,
		Printer,
		RotateCcw,
		X,
		Package,
		AlertCircle,
		AlertTriangle,
		Volume2,
		VolumeX,
		Droplets,
		Zap,
		Cpu,
		Layers,
		ArrowRight
	} from 'lucide-svelte';

	let { data } = $props();

	// Local mutable product state to reflect stock deductions immediately
	let products = $state<Product[]>(data.products);

	// Catalog filters
	let searchQuery = $state('');
	let selectedCategory = $state<'all' | 'low_stock' | 'out_of_stock' | ProductCategory>('all');

	// Cart state
	interface CartItem {
		product: Product;
		quantity: number;
	}

	let cart = $state<CartItem[]>([]);
	let discount = $state<number>(0);

	// Mobile & Tablet cart drawer state
	let mobileCartDrawerOpen = $state(false);

	// Checkout modal state
	let checkoutModalOpen = $state(false);
	let paymentMethod = $state<PaymentMethod>('Cash');
	let paidAmount = $state<number>(0);
	let isProcessing = $state(false);

	// Transaction success modal state
	let successModalOpen = $state(false);
	let completedSale = $state<{ saleId: number; invoiceNumber: string; grandTotal: number; changeAmount: number } | null>(null);

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	// Filtered catalog
	const filteredProducts = $derived(
		products.filter((p) => {
			let matchesCategory = true;
			if (selectedCategory === 'low_stock') {
				matchesCategory = p.stock > 0 && p.stock <= (p.min_stock || 5);
			} else if (selectedCategory === 'out_of_stock') {
				matchesCategory = p.stock <= 0;
			} else if (selectedCategory !== 'all') {
				matchesCategory = p.category === selectedCategory;
			}

			const q = searchQuery.toLowerCase().trim();
			const matchesSearch =
				q === '' ||
				p.name.toLowerCase().includes(q) ||
				p.sku.toLowerCase().includes(q);
			return matchesCategory && matchesSearch;
		})
	);

	// Cart calculations
	const subtotal = $derived(
		cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0)
	);

	const grandTotal = $derived(
		Math.max(0, subtotal - (Number(discount) || 0))
	);

	const totalItemsCount = $derived(
		cart.reduce((sum, item) => sum + item.quantity, 0)
	);

	const changeAmount = $derived(
		Math.max(0, (paidAmount || 0) - grandTotal)
	);

	function addToCart(product: Product) {
		// Alert MERAH: Stok Habis
		if (product.stock <= 0) {
			showToast(`Peringatan: Stok "${product.name}" HABIS (0)!`, 'error');
			return;
		}

		const existingIndex = cart.findIndex((item) => item.product.id === product.id);
		let currentCartQty = 0;

		if (existingIndex > -1) {
			if (cart[existingIndex].quantity >= product.stock) {
				showToast(`Batas stok tercapai: Hanya ada ${product.stock} ${product.unit} untuk "${product.name}".`, 'warning');
				return;
			}
			cart[existingIndex].quantity += 1;
			currentCartQty = cart[existingIndex].quantity;
		} else {
			cart.push({ product, quantity: 1 });
			currentCartQty = 1;
		}

		// Warning KUNING/AMBER: Stok Menipis
		const remainingStock = product.stock - currentCartQty;
		if (remainingStock <= (product.min_stock || 5) && remainingStock > 0) {
			showToast(`Perhatian: Stok "${product.name}" menipis! Sisa ${remainingStock} ${product.unit}.`, 'warning');
		} else if (remainingStock === 0) {
			showToast(`Perhatian: Semua stok (${product.stock} ${product.unit}) "${product.name}" sudah masuk keranjang!`, 'warning');
		}
	}

	function updateQuantity(productId: number, delta: number) {
		const index = cart.findIndex((item) => item.product.id === productId);
		if (index === -1) return;

		const item = cart[index];
		const newQty = item.quantity + delta;

		if (newQty <= 0) {
			cart.splice(index, 1);
		} else if (newQty > item.product.stock) {
			showToast(`Stok maksimal hanya tersedia ${item.product.stock} ${item.product.unit}.`, 'warning');
		} else {
			item.quantity = newQty;
			const remaining = item.product.stock - newQty;
			if (remaining <= (item.product.min_stock || 5) && remaining > 0 && delta > 0) {
				showToast(`Stok menipis: sisa ${remaining} ${item.product.unit}.`, 'warning');
			}
		}
	}

	function removeFromCart(productId: number) {
		cart = cart.filter((item) => item.product.id !== productId);
	}

	function clearCart() {
		cart = [];
		discount = 0;
	}

	function openCheckout() {
		if (cart.length === 0) return;
		paidAmount = grandTotal; // Default to exact amount
		mobileCartDrawerOpen = false;
		checkoutModalOpen = true;
	}

	function setQuickAmount(amount: number) {
		paidAmount = amount;
	}

	async function processTransaction() {
		if (cart.length === 0) return;
		if (paidAmount < grandTotal) {
			showToast('Nominal pembayaran kurang dari total belanja!', 'error');
			return;
		}

		isProcessing = true;
		try {
			const res = await fetch('/api/pos/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
					discount,
					paidAmount,
					paymentMethod
				})
			});

			if (!res.ok) {
				let errorMsg = 'Transaksi gagal diproses';
				try {
					const errData = await res.json();
					if (errData?.error) errorMsg = errData.error;
				} catch {
					errorMsg = `Koneksi Server Terputus (${res.status} ${res.statusText || 'Gateway Error'}). Pastikan server lokal tetap aktif!`;
				}
				showToast(errorMsg, 'error');
				isProcessing = false;
				return;
			}

			const resData = await res.json();

			// Deduct local product stock immediately
			for (const cartItem of cart) {
				const prod = products.find((p) => p.id === cartItem.product.id);
				if (prod) {
					prod.stock -= cartItem.quantity;
				}
			}

			completedSale = {
				saleId: resData.saleId,
				invoiceNumber: resData.invoiceNumber,
				grandTotal,
				changeAmount
			};

			checkoutModalOpen = false;
			successModalOpen = true;
			clearCart();
			showToast(`Transaksi berhasil! No. Invoice: ${resData.invoiceNumber}`, 'success');
		} catch (err) {
			showToast('Terjadi gangguan jaringan saat memproses transaksi.', 'error');
		} finally {
			isProcessing = false;
		}
	}

	function resetForNewSale() {
		successModalOpen = false;
		completedSale = null;
		clearCart();
	}
</script>

<svelte:head>
	<title>POS / Kasir Toko - SS VAPE</title>
</svelte:head>

<Header title="Sistem Kasir (POS)" />

<!-- MAIN POS WRAPPER: Full Height, Responsive Layout -->
<div class="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full overflow-hidden relative">
	
	<!-- LEFT COLUMN: Product Catalog Grid -->
	<div class="flex-1 flex flex-col min-w-0 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 sm:p-4 overflow-hidden mb-16 lg:mb-0">
		<!-- Search, Sound Toggle & Category Filters -->
		<div class="space-y-2.5 sm:space-y-3 mb-3 shrink-0">
			<!-- Search Bar & Sound Quick Control -->
			<div class="flex items-center gap-2">
				<div class="relative flex-1">
					<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
						<Search class="w-4 h-4" />
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Cari produk vape (nama atau SKU)..."
						class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
					/>
				</div>

				<!-- Sound Toggle Button on POS -->
				<button
					type="button"
					onclick={() => toggleSound()}
					class="p-2.5 rounded-xl border transition cursor-pointer shrink-0 {$soundEnabled ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}"
					title={$soundEnabled ? 'Suara POS Aktif (Klik untuk mute)' : 'Suara POS Mute (Klik untuk aktifkan)'}
					aria-label={$soundEnabled ? 'Matikan suara kasir' : 'Nyalakan suara kasir'}
				>
					{#if $soundEnabled}
						<Volume2 class="w-5 h-5 text-emerald-400" />
					{:else}
						<VolumeX class="w-5 h-5" />
					{/if}
				</button>
			</div>

			<!-- Category Filter Pills (Horizontal Touch Scroll) -->
			<div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
				<button
					type="button"
					onclick={() => (selectedCategory = 'all')}
					class="px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer {selectedCategory === 'all' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}"
				>
					Semua ({products.length})
				</button>

				<!-- Filter Stok Menipis (Kuning) -->
				<button
					type="button"
					onclick={() => (selectedCategory = 'low_stock')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 {selectedCategory === 'low_stock' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-950 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10'}"
				>
					<AlertTriangle class="w-3.5 h-3.5" />
					<span>Stok Menipis</span>
				</button>

				<!-- Filter Stok Habis (Merah) -->
				<button
					type="button"
					onclick={() => (selectedCategory = 'out_of_stock')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 {selectedCategory === 'out_of_stock' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'bg-slate-950 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10'}"
				>
					<AlertCircle class="w-3.5 h-3.5" />
					<span>Stok Habis</span>
				</button>

				<button
					type="button"
					onclick={() => (selectedCategory = 'device')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer {selectedCategory === 'device' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}"
				>
					Device
				</button>
				<button
					type="button"
					onclick={() => (selectedCategory = 'liquid')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer {selectedCategory === 'liquid' ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}"
				>
					Liquid
				</button>
				<button
					type="button"
					onclick={() => (selectedCategory = 'coil')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer {selectedCategory === 'coil' ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}"
				>
					Coil
				</button>
				<button
					type="button"
					onclick={() => (selectedCategory = 'catridge')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer {selectedCategory === 'catridge' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}"
				>
					Catridge
				</button>
				<button
					type="button"
					onclick={() => (selectedCategory = 'other')}
					class="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer {selectedCategory === 'other' ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'}"
				>
					Lainnya
				</button>
			</div>
		</div>

		<!-- Product Grid (Scrollable, Touch-friendly on Tablet & Mobile) -->
		<div class="flex-1 overflow-y-auto pr-1">
			{#if filteredProducts.length === 0}
				<div class="h-64 flex flex-col items-center justify-center text-slate-500 text-xs text-center">
					<Package class="w-10 h-10 mb-2 opacity-50" />
					<p class="font-semibold text-slate-400">Tidak ada produk vape ditemukan.</p>
					<p class="text-[11px] text-slate-500 mt-1">Coba ganti filter kategori atau kata kunci pencarian.</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
					{#each filteredProducts as prod}
						{@const isOutOfStock = prod.stock <= 0}
						{@const isLowStock = !isOutOfStock && prod.stock <= (prod.min_stock || 5)}

						<!-- Touch-friendly Product Card -->
						<button
							type="button"
							onclick={() => addToCart(prod)}
							class="text-left rounded-xl p-2.5 sm:p-3 transition duration-150 flex flex-col justify-between group relative overflow-hidden active:scale-98 cursor-pointer shadow-sm min-h-[160px] sm:min-h-[190px] border {isOutOfStock ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30' : isLowStock ? 'bg-amber-950/15 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/25' : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800/90 hover:border-emerald-500/50'}"
						>
							<div>
								<!-- Image or Placeholder -->
								<div class="w-full aspect-square rounded-lg bg-slate-900 overflow-hidden mb-2 flex items-center justify-center relative border border-slate-800">
									{#if prod.photo}
										<img src={prod.photo} alt={prod.name} loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
									{:else}
										<Package class="w-7 h-7 sm:w-8 sm:h-8 text-slate-600" />
									{/if}

									<!-- Category badge overlay -->
									<span class="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md {prod.category === 'device' ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' : prod.category === 'liquid' ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40' : prod.category === 'coil' ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-500/40' : prod.category === 'catridge' ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40' : 'bg-purple-950/90 text-purple-300 border border-purple-500/40'}">
										{prod.category === 'other' ? 'Lainnya' : prod.category}
									</span>

									<!-- OUT OF STOCK OVERLAY (MERAH) -->
									{#if isOutOfStock}
										<div class="absolute inset-0 bg-black/75 flex flex-col items-center justify-center backdrop-blur-xs p-1">
											<span class="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-rose-600/40 animate-pulse">
												HABIS (0)
											</span>
											<span class="text-[9px] text-rose-300 font-semibold mt-0.5">Klik untuk alert</span>
										</div>
									{:else if isLowStock}
										<!-- LOW STOCK BADGE (KUNING / MENIPIS) -->
										<div class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 font-black text-[9px] uppercase tracking-tight shadow-md flex items-center gap-0.5">
											<AlertTriangle class="w-2.5 h-2.5" />
											<span>Sisa {prod.stock}</span>
										</div>
									{/if}
								</div>

								<!-- Name & Specs -->
								<p class="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-300 transition">
									{prod.name}
								</p>

								{#if prod.category === 'liquid'}
									<p class="text-[10px] text-slate-400 mt-0.5 truncate">
										{prod.liquid_type} &bull; {prod.nicotine_mg || 0}mg &bull; {prod.volume_ml || 0}ml
									</p>
								{:else if prod.category === 'catridge'}
									<p class="text-[10px] text-slate-400 mt-0.5 truncate">
										Ohm: {prod.resistance_ohm || '-'}
									</p>
								{/if}
							</div>

							<!-- Price & Stock Indicator -->
							<div class="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
								<span class="font-bold text-emerald-400 text-xs sm:text-sm font-mono">
									{formatRupiah(prod.selling_price)}
								</span>
								
								<!-- Stock Indicator with Distinct Colors -->
								<span class="text-[10px] sm:text-xs font-mono font-bold {isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-400'}">
									{#if isOutOfStock}
										Habis
									{:else if isLowStock}
										Menipis ({prod.stock})
									{:else}
										Stok: {prod.stock}
									{/if}
								</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- RIGHT COLUMN: Desktop & Tablet Landscape Cart (Sticky Side-by-Side) -->
	<div class="hidden lg:flex w-96 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex-col h-full overflow-hidden shadow-2xl shrink-0">
		<!-- Cart Header -->
		<div class="p-4 border-b border-slate-800 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<ShoppingCart class="w-4 h-4 text-emerald-400" />
				<h3 class="font-bold text-white text-sm">Keranjang Kasir</h3>
				<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
					{totalItemsCount} item
				</span>
			</div>
			{#if cart.length > 0}
				<button
					type="button"
					onclick={clearCart}
					class="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer font-semibold"
				>
					Kosongkan
				</button>
			{/if}
		</div>

		<!-- Cart Items List (Scrollable) -->
		<div class="flex-1 overflow-y-auto p-3 space-y-2">
			{#if cart.length === 0}
				<div class="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
					<ShoppingCart class="w-12 h-12 text-slate-700 mb-2" />
					<p class="font-semibold text-slate-400">Keranjang masih kosong</p>
					<p class="text-[11px] text-slate-500 mt-1">Ketuk produk pada katalog sebelah kiri untuk menambah ke kasir.</p>
				</div>
			{:else}
				{#each cart as item}
					<div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
						<div class="min-w-0 flex-1">
							<p class="font-bold text-white text-xs truncate">{item.product.name}</p>
							<p class="text-[11px] text-slate-400 font-mono mt-0.5">
								{formatRupiah(item.product.selling_price)} &times; {item.quantity}
							</p>
							<p class="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
								{formatRupiah(item.product.selling_price * item.quantity)}
							</p>
						</div>

						<!-- Quantity Controls -->
						<div class="flex items-center gap-1.5 shrink-0">
							<button
								type="button"
								onclick={() => updateQuantity(item.product.id, -1)}
								class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
								aria-label="Kurangi kuantitas"
							>
								<Minus class="w-3.5 h-3.5" />
							</button>
							<span class="w-7 text-center font-bold text-xs font-mono text-white">
								{item.quantity}
							</span>
							<button
								type="button"
								onclick={() => updateQuantity(item.product.id, 1)}
								disabled={item.quantity >= item.product.stock}
								class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
								aria-label="Tambah kuantitas"
							>
								<Plus class="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onclick={() => removeFromCart(item.product.id)}
								class="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition cursor-pointer ml-1"
								title="Hapus dari keranjang"
								aria-label="Hapus item"
							>
								<Trash2 class="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Cart Bottom Summary -->
		<div class="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3 shrink-0">
			<div class="flex items-center justify-between text-xs text-slate-400">
				<span>Subtotal:</span>
				<span class="font-mono text-white font-semibold">{formatRupiah(subtotal)}</span>
			</div>

			<!-- Discount Input -->
			<div class="flex items-center justify-between text-xs text-slate-400">
				<span>Diskon:</span>
				<div class="flex items-center gap-1">
					<span class="text-slate-500 font-mono">Rp</span>
					<input
						type="number"
						min="0"
						step="1000"
						bind:value={discount}
						class="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
					/>
				</div>
			</div>

			<!-- Grand Total -->
			<div class="pt-2 border-t border-slate-800 flex items-center justify-between">
				<span class="font-bold text-white text-sm">TOTAL:</span>
				<span class="font-black text-xl text-emerald-400 font-mono tracking-tight">
					{formatRupiah(grandTotal)}
				</span>
			</div>

			<!-- Checkout Button -->
			<button
				type="button"
				disabled={cart.length === 0}
				onclick={openCheckout}
				class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-98 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<CreditCard class="w-4 h-4" />
				<span>Bayar ({formatRupiah(grandTotal)})</span>
			</button>
		</div>
	</div>

	<!-- MOBILE & TABLET PORTRAIT: FLOATING BOTTOM CART BAR (< lg) -->
	<div class="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#0c1220]/95 border-t border-slate-800/90 z-30 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3">
		<div class="min-w-0">
			<div class="flex items-center gap-1.5">
				<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
					{totalItemsCount} item
				</span>
				<span class="text-[11px] text-slate-400">Total:</span>
			</div>
			<p class="text-base font-black text-emerald-400 font-mono tracking-tight truncate">
				{formatRupiah(grandTotal)}
			</p>
		</div>

		<button
			type="button"
			disabled={cart.length === 0}
			onclick={() => (mobileCartDrawerOpen = true)}
			class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
		>
			<ShoppingCart class="w-4 h-4" />
			<span>Lihat Keranjang & Bayar</span>
			<ArrowRight class="w-3.5 h-3.5" />
		</button>
	</div>
</div>

<!-- MOBILE & TABLET CART DRAWER MODAL (< lg) -->
{#if mobileCartDrawerOpen}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in lg:hidden">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0" onclick={() => (mobileCartDrawerOpen = false)}></div>

		<div class="relative w-full max-w-lg bg-[#0c1220] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden z-10 animate-slide-up">
			<!-- Drawer Header -->
			<div class="p-4 border-b border-slate-800 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<ShoppingCart class="w-5 h-5 text-emerald-400" />
					<h3 class="font-bold text-white text-base">Keranjang Belanja ({totalItemsCount} item)</h3>
				</div>
				<button
					type="button"
					onclick={() => (mobileCartDrawerOpen = false)}
					class="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
					aria-label="Tutup keranjang"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Drawer Items List -->
			<div class="flex-1 overflow-y-auto p-4 space-y-2.5">
				{#if cart.length === 0}
					<div class="py-12 text-center text-slate-500">
						<ShoppingCart class="w-12 h-12 mx-auto mb-2 opacity-50" />
						<p>Keranjang kosong</p>
					</div>
				{:else}
					{#each cart as item}
						<div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
							<div class="min-w-0 flex-1">
								<p class="font-bold text-white text-sm truncate">{item.product.name}</p>
								<p class="text-xs text-slate-400 font-mono mt-0.5">
									{formatRupiah(item.product.selling_price)}
								</p>
								<p class="text-xs font-mono text-emerald-400 font-bold mt-0.5">
									Total: {formatRupiah(item.product.selling_price * item.quantity)}
								</p>
							</div>

							<!-- Controls -->
							<div class="flex items-center gap-2 shrink-0">
								<button
									type="button"
									onclick={() => updateQuantity(item.product.id, -1)}
									class="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"
								>
									<Minus class="w-3.5 h-3.5" />
								</button>
								<span class="w-7 text-center font-bold font-mono text-sm text-white">
									{item.quantity}
								</span>
								<button
									type="button"
									onclick={() => updateQuantity(item.product.id, 1)}
									disabled={item.quantity >= item.product.stock}
									class="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center disabled:opacity-30"
								>
									<Plus class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => removeFromCart(item.product.id)}
									class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center ml-1"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Drawer Footer -->
			<div class="p-4 border-t border-slate-800 bg-slate-950 space-y-3 shrink-0">
				<div class="flex items-center justify-between text-xs text-slate-400">
					<span>Subtotal:</span>
					<span class="font-mono text-white font-semibold">{formatRupiah(subtotal)}</span>
				</div>

				<div class="flex items-center justify-between text-xs text-slate-400">
					<span>Diskon:</span>
					<div class="flex items-center gap-1">
						<span class="text-slate-500 font-mono">Rp</span>
						<input
							type="number"
							min="0"
							step="1000"
							bind:value={discount}
							class="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs text-right font-mono"
						/>
					</div>
				</div>

				<div class="pt-2 border-t border-slate-800 flex items-center justify-between">
					<span class="font-bold text-white text-base">TOTAL:</span>
					<span class="font-black text-2xl text-emerald-400 font-mono">
						{formatRupiah(grandTotal)}
					</span>
				</div>

				<button
					type="button"
					disabled={cart.length === 0}
					onclick={openCheckout}
					class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
				>
					<CreditCard class="w-4 h-4" />
					<span>Lanjut ke Pembayaran ({formatRupiah(grandTotal)})</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- CHECKOUT MODAL: Touch-optimized for Tablet & Mobile -->
{#if checkoutModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
		<div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[95vh] overflow-y-auto">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800">
				<div>
					<h3 class="font-bold text-white text-base sm:text-lg">Pembayaran Kasir POS</h3>
					<p class="text-xs text-slate-400 mt-0.5">Pilih metode bayar & masukkan nominal uang</p>
				</div>
				<button
					type="button"
					onclick={() => (checkoutModalOpen = false)}
					class="p-1.5 rounded-lg text-slate-400 hover:text-white"
					aria-label="Batal checkout"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Total Tagihan -->
			<div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
				<span class="text-xs text-slate-400 uppercase font-semibold">Total Tagihan</span>
				<p class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
					{formatRupiah(grandTotal)}
				</p>
			</div>

			<!-- Metode Pembayaran -->
			<div>
				<label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
					Metode Pembayaran
				</label>
				<div class="grid grid-cols-3 gap-2">
					{#each ['Cash', 'QRIS', 'Transfer'] as method}
						<button
							type="button"
							onclick={() => (paymentMethod = method as PaymentMethod)}
							class="py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer {paymentMethod === method ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}"
						>
							{method}
						</button>
					{/each}
				</div>
			</div>

			<!-- Nominal Uang Dibayar -->
			<div>
				<label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
					Uang Diterima (Bayar)
				</label>
				<div class="relative">
					<span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-sm">
						Rp
					</span>
					<input
						type="number"
						min="0"
						step="1000"
						bind:value={paidAmount}
						class="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
					/>
				</div>

				<!-- Tombol Uang Pas & Pecahan Cepat -->
				<div class="grid grid-cols-4 gap-1.5 mt-2">
					<button
						type="button"
						onclick={() => setQuickAmount(grandTotal)}
						class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-400 transition"
					>
						Uang Pas
					</button>
					<button
						type="button"
						onclick={() => setQuickAmount(Math.ceil(grandTotal / 50000) * 50000)}
						class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition"
					>
						{formatRupiah(Math.ceil(grandTotal / 50000) * 50000 || 50000)}
					</button>
					<button
						type="button"
						onclick={() => setQuickAmount(Math.ceil(grandTotal / 100000) * 100000)}
						class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition"
					>
						{formatRupiah(Math.ceil(grandTotal / 100000) * 100000 || 100000)}
					</button>
					<button
						type="button"
						onclick={() => setQuickAmount(grandTotal + 50000)}
						class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition"
					>
						+50rb
					</button>
				</div>
			</div>

			<!-- Kembalian -->
			<div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
				<span class="text-xs text-slate-400">Kembalian:</span>
				<span class="text-base font-bold font-mono {changeAmount > 0 ? 'text-cyan-400' : 'text-slate-400'}">
					{formatRupiah(changeAmount)}
				</span>
			</div>

			<!-- Action Buttons -->
			<div class="grid grid-cols-2 gap-3 pt-2">
				<button
					type="button"
					onclick={() => (checkoutModalOpen = false)}
					class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer"
				>
					Batal
				</button>
				<button
					type="button"
					disabled={isProcessing || paidAmount < grandTotal}
					onclick={processTransaction}
					class="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{#if isProcessing}
						<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
						<span>Memproses...</span>
					{:else}
						<CheckCircle2 class="w-4 h-4" />
						<span>Konfirmasi Bayar</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- SUCCESS / PRINT INVOICE MODAL -->
{#if successModalOpen && completedSale}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
		<div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-5">
			<!-- Success Animation Icon -->
			<div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
				<CheckCircle2 class="w-9 h-9 animate-bounce" />
			</div>

			<div>
				<h3 class="text-xl font-black text-white">Transaksi Berhasil!</h3>
				<p class="text-xs text-slate-400 mt-1">Pembayaran telah diterima dan stok otomatis diperbarui.</p>
			</div>

			<!-- Sale Details Card -->
			<div class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
				<div class="flex justify-between">
					<span class="text-slate-500">Invoice:</span>
					<span class="font-bold text-white">{completedSale.invoiceNumber}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-slate-500">Total Belanja:</span>
					<span class="font-bold text-emerald-400">{formatRupiah(completedSale.grandTotal)}</span>
				</div>
				<div class="flex justify-between pt-1 border-t border-slate-800">
					<span class="text-slate-500">Kembalian:</span>
					<span class="font-bold text-cyan-400">{formatRupiah(completedSale.changeAmount)}</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="grid grid-cols-2 gap-3 pt-2">
				<button
					type="button"
					onclick={resetForNewSale}
					class="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
				>
					<RotateCcw class="w-4 h-4" />
					<span>Transaksi Baru</span>
				</button>
				<a
					href="/transactions/{completedSale.saleId}"
					target="_blank"
					class="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
				>
					<Printer class="w-4 h-4" />
					<span>Cetak Struk</span>
				</a>
			</div>
		</div>
	</div>
{/if}
