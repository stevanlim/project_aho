<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { enhance } from '$app/forms';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import {
		ArrowDownToLine,
		Package,
		Boxes,
		History,
		AlertCircle,
		CheckCircle2,
		Search,
		X,
		ChevronDown,
		Check,
		RotateCcw,
		Plus,
		Minus
	} from 'lucide-svelte';

	let { data, form } = $props();

	let selectedProductId = $state<number | ''>('');
	let searchQuery = $state<string>('');
	let selectedCategoryFilter = $state<string>('all');
	let isDropdownOpen = $state<boolean>(false);
	let operationMode = $state<'add' | 'subtract'>('add');
	let quantity = $state<number>(1);
	let purchasePrice = $state<number>(0);
	let note = $state<string>('');
	let isSubmitting = $state(false);

	let dropdownContainerRef = $state<HTMLDivElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);
	let quantityInputRef = $state<HTMLInputElement | null>(null);

	const selectedProduct = $derived(
		data.products.find((p) => p.id === Number(selectedProductId)) || null
	);

	const categories = [
		{ id: 'all', label: 'Semua Kategori' },
		{ id: 'liquid', label: 'Liquid' },
		{ id: 'device', label: 'Device' },
		{ id: 'catridge', label: 'Cartridge' },
		{ id: 'coil', label: 'Coil' },
		{ id: 'other', label: 'Lainnya' }
	];

	const filteredProducts = $derived(
		data.products.filter((p) => {
			const matchesCategory =
				selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
			if (!matchesCategory) return false;

			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase().trim();
			const matchName = p.name.toLowerCase().includes(q);
			const matchSku = p.sku.toLowerCase().includes(q);
			const matchCategory = p.category?.toLowerCase().includes(q);
			const matchLiquidType = p.liquid_type?.toLowerCase().includes(q);
			const matchNic = p.nicotine_mg ? `${p.nicotine_mg}mg`.toLowerCase().includes(q) : false;
			const matchRes = p.resistance_ohm?.toLowerCase().includes(q);

			return matchName || matchSku || matchCategory || matchLiquidType || matchNic || matchRes;
		})
	);

	function selectProduct(prod: (typeof data.products)[0]) {
		selectedProductId = prod.id;
		purchasePrice = Number(prod.purchase_price) || 0;
		isDropdownOpen = false;
		setTimeout(() => {
			quantityInputRef?.focus();
		}, 100);
	}

	function clearSelectedProduct() {
		selectedProductId = '';
		searchQuery = '';
		isDropdownOpen = true;
		setTimeout(() => {
			searchInputRef?.focus();
		}, 100);
	}

	function setOperationMode(mode: 'add' | 'subtract') {
		operationMode = mode;
		if (mode === 'subtract') {
			if (quantity > 0) {
				quantity = -quantity;
			} else if (quantity === 0) {
				quantity = -1;
			}
		} else {
			if (quantity < 0) {
				quantity = Math.abs(quantity);
			} else if (quantity === 0) {
				quantity = 1;
			}
		}
	}

	function adjustQuantity(delta: number) {
		const next = (quantity || 0) + delta;
		if (next === 0) {
			quantity = delta > 0 ? 1 : -1;
		} else {
			quantity = next;
		}
		operationMode = quantity < 0 ? 'subtract' : 'add';
	}

	function setDirectQuantity(val: number) {
		quantity = val;
		operationMode = val < 0 ? 'subtract' : 'add';
	}

	function onQuantityInput(e: Event) {
		const val = Number((e.target as HTMLInputElement).value);
		if (!isNaN(val)) {
			if (val < 0) {
				operationMode = 'subtract';
			} else if (val > 0) {
				operationMode = 'add';
			}
		}
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isDropdownOpen = false;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filteredProducts.length > 0) {
				selectProduct(filteredProducts[0]);
			}
		} else if (!isDropdownOpen) {
			isDropdownOpen = true;
		}
	}

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	$effect(() => {
		if (isDropdownOpen) {
			const onDocClick = (e: MouseEvent) => {
				if (dropdownContainerRef && !dropdownContainerRef.contains(e.target as Node)) {
					isDropdownOpen = false;
				}
			};
			window.addEventListener('click', onDocClick);
			return () => window.removeEventListener('click', onDocClick);
		}
	});

	$effect(() => {
		if (form?.success && form?.message) {
			showToast(form.message, 'success');
			quantity = 1;
			operationMode = 'add';
			note = '';
			selectedProductId = '';
			searchQuery = '';
			isDropdownOpen = false;
		} else if (form?.error) {
			showToast(form.error, 'error');
		}
	});
</script>

<svelte:head>
	<title>Barang Masuk & Koreksi Stok - SS VAPE</title>
</svelte:head>

<Header title="Barang Masuk & Koreksi Stok" />

<div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
	<!-- Top info & link to mutations -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div>
			<h2 class="text-xl font-bold text-white flex items-center gap-2">
				<ArrowDownToLine class="w-5 h-5 text-emerald-400" />
				Catat Pemasukan / Koreksi Stok
			</h2>
			<p class="text-xs text-slate-400 mt-0.5">Input stok barang masuk dari supplier atau koreksi minus (-) jika sebelumnya ada kelebihan input.</p>
		</div>
		<a
			href="/stock/mutations"
			class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shrink-0"
		>
			<History class="w-4 h-4 text-cyan-400" />
			<span>Lihat Riwayat Mutasi</span>
		</a>
	</div>

	<!-- Form Card -->
	<div class="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-xl">
		{#if form?.error}
			<div class="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
				<AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}
			class="space-y-6"
		>
			<!-- Hidden input for form submission -->
			<input type="hidden" name="product_id" value={selectedProductId} />

			<!-- Search & Selection Section -->
			<div class="space-y-3" bind:this={dropdownContainerRef}>
				<div class="flex items-center justify-between">
					<label for="product_search_input" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
						Pilih Produk Vape <span class="text-rose-400">*</span>
					</label>
					<span class="text-xs text-slate-400">
						Total <strong class="text-slate-200">{data.products.length}</strong> produk aktif
					</span>
				</div>

				<!-- Category Filter Pills -->
				<div class="flex flex-wrap gap-1.5 pb-1">
					{#each categories as cat}
						<button
							type="button"
							onclick={() => {
								selectedCategoryFilter = cat.id;
								isDropdownOpen = true;
							}}
							class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer {selectedCategoryFilter === cat.id
								? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
								: 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'}"
						>
							{cat.label}
						</button>
					{/each}
				</div>

				<!-- Search Input Box with Dropdown Trigger -->
				<div class="relative">
					<div class="relative flex items-center">
						<Search class="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
						<input
							id="product_search_input"
							type="text"
							bind:this={searchInputRef}
							bind:value={searchQuery}
							onfocus={() => (isDropdownOpen = true)}
							onclick={() => (isDropdownOpen = true)}
							onkeydown={onSearchKeydown}
							placeholder="Ketik untuk mencari produk (nama, SKU, rasa, resistance)..."
							class="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
							autocomplete="off"
						/>
						{#if searchQuery}
							<button
								type="button"
								onclick={() => {
									searchQuery = '';
									searchInputRef?.focus();
								}}
								class="absolute right-3 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
								title="Hapus pencarian"
							>
								<X class="w-4 h-4" />
							</button>
						{:else}
							<ChevronDown class="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none transition-transform duration-200 {isDropdownOpen ? 'rotate-180 text-emerald-400' : ''}" />
						{/if}
					</div>

					<!-- Floating Search Results Dropdown -->
					{#if isDropdownOpen}
						<div
							class="absolute z-40 left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-xl overflow-hidden animate-fade-in"
						>
							<div class="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
								<span>Ditemukan <strong class="text-emerald-400">{filteredProducts.length}</strong> produk</span>
								<span class="text-slate-500 text-[10px]">Klik produk untuk memilih • Enter untuk opsi pertama</span>
							</div>

							<div class="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
								{#if filteredProducts.length === 0}
									<div class="py-8 px-4 text-center">
										<Package class="w-8 h-8 text-slate-600 mx-auto mb-2" />
										<p class="text-sm font-semibold text-slate-300">Produk tidak ditemukan</p>
										<p class="text-xs text-slate-500 mt-1">
											Tidak ada produk yang cocok dengan pencarian "{searchQuery}" pada filter ini.
										</p>
									</div>
								{:else}
									{#each filteredProducts as prod}
										<button
											type="button"
											onclick={() => selectProduct(prod)}
											class="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-800/80 transition cursor-pointer group {selectedProductId === prod.id ? 'bg-emerald-500/10' : ''}"
										>
											<!-- Photo Thumbnail -->
											<div class="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-slate-700 transition">
												{#if prod.photo}
													<img src={prod.photo} alt={prod.name} class="w-full h-full object-cover" />
												{:else}
													<Package class="w-5 h-5 text-slate-500" />
												{/if}
											</div>

											<!-- Details -->
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-1.5 flex-wrap">
													<span class="font-mono text-xs font-bold text-emerald-400">{prod.sku}</span>
													<span
														class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase {prod.category === 'device' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : prod.category === 'liquid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : prod.category === 'coil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : prod.category === 'catridge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}"
													>
														{prod.category}
													</span>
													{#if prod.category === 'liquid' && prod.liquid_type}
														<span class="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 font-medium">
															{prod.liquid_type} {prod.nicotine_mg ? `${prod.nicotine_mg}mg` : ''} {prod.volume_ml ? `${prod.volume_ml}ml` : ''}
														</span>
													{/if}
													{#if prod.category === 'catridge' && prod.resistance_ohm}
														<span class="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 font-medium">
															{prod.resistance_ohm}
														</span>
													{/if}
												</div>
												<div class="font-bold text-white text-sm truncate mt-0.5 group-hover:text-emerald-300 transition">
													{prod.name}
												</div>
												<div class="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
													<span>
														Stok Saat Ini:
														<strong class="{prod.stock <= 0 ? 'text-rose-400 font-bold' : prod.stock <= 5 ? 'text-amber-400 font-bold' : 'text-slate-200'}">
															{prod.stock} {prod.unit}
														</strong>
													</span>
													<span>&bull;</span>
													<span>
														Modal: <strong class="text-slate-300 font-mono">{formatRupiah(Number(prod.purchase_price) || 0)}</strong>
													</span>
												</div>
											</div>

											<!-- Checkmark indicator -->
											{#if selectedProductId === prod.id}
												<div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
													<Check class="w-3.5 h-3.5" />
												</div>
											{/if}
										</button>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Selected Product Card & Information -->
				{#if selectedProduct}
					<div class="p-4 rounded-xl bg-slate-950/90 border {quantity < 0 ? 'border-rose-500/30 shadow-rose-500/5' : 'border-emerald-500/30 shadow-emerald-500/5'} shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
						<div class="flex items-center gap-3.5 min-w-0">
							<div class="w-13 h-13 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
								{#if selectedProduct.photo}
									<img src={selectedProduct.photo} alt={selectedProduct.name} class="w-full h-full object-cover" />
								{:else}
									<Package class="w-6 h-6 text-slate-500" />
								{/if}
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-xs font-mono text-emerald-400 font-bold">{selectedProduct.sku}</span>
									<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase {selectedProduct.category === 'device' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : selectedProduct.category === 'liquid' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : selectedProduct.category === 'coil' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : selectedProduct.category === 'catridge' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'}">
										{selectedProduct.category}
									</span>
									{#if selectedProduct.category === 'liquid' && selectedProduct.liquid_type}
										<span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
											{selectedProduct.liquid_type} {selectedProduct.nicotine_mg ? `${selectedProduct.nicotine_mg}mg` : ''}
										</span>
									{/if}
								</div>
								<p class="font-bold text-white text-sm sm:text-base truncate mt-0.5">{selectedProduct.name}</p>
								<div class="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
									<span>Stok Saat Ini: <strong class="text-white">{selectedProduct.stock} {selectedProduct.unit}</strong></span>
									<span>&bull;</span>
									<span>
										Perubahan:
										<strong class="{quantity < 0 ? 'text-rose-400' : 'text-emerald-400'} font-bold">
											{quantity > 0 ? `+${quantity}` : quantity} {selectedProduct.unit}
										</strong>
									</span>
									<span>&bull;</span>
									<span>
										Estimasi Sisa Baru:
										<strong class="{(selectedProduct.stock || 0) + (quantity || 0) < 0 ? 'text-rose-500 underline font-bold' : 'text-cyan-400 font-bold'}">
											{(selectedProduct.stock || 0) + (quantity || 0)} {selectedProduct.unit}
										</strong>
									</span>
								</div>
							</div>
						</div>

						<button
							type="button"
							onclick={clearSelectedProduct}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer shrink-0"
						>
							<RotateCcw class="w-3.5 h-3.5 text-cyan-400" />
							<span>Ganti Produk</span>
						</button>
					</div>
				{:else}
					<div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
						<AlertCircle class="w-4 h-4 text-amber-400 shrink-0" />
						<span>Ketik nama atau SKU pada kolom pencarian di atas untuk memilih produk.</span>
					</div>
				{/if}
			</div>

			<!-- Quantity Section with Operation Mode (Plus / Minus) -->
			<div class="space-y-3 pt-2 border-t border-slate-800/80">
				<!-- Mode Selector: Tambah vs Kurangi (Mines) -->
				<div>
					<label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
						Tipe Perubahan Stok <span class="text-rose-400">*</span>
					</label>
					<div class="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
						<button
							type="button"
							onclick={() => setOperationMode('add')}
							class="py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer {operationMode === 'add'
								? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
								: 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"
						>
							<Plus class="w-4 h-4 text-emerald-400" />
							<span>Tambah Stok Masuk (+)</span>
						</button>
						<button
							type="button"
							onclick={() => setOperationMode('subtract')}
							class="py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer {operationMode === 'subtract'
								? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
								: 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"
						>
							<Minus class="w-4 h-4 text-rose-400" />
							<span>Kurangi / Koreksi Kelebihan (-)</span>
						</button>
					</div>
				</div>

				<!-- Quantity and Purchase Price Grid -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<div class="flex items-center justify-between mb-1.5">
							<label for="quantity" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
								{quantity < 0 ? 'Jumlah Pengurangan (Mines)' : 'Jumlah Barang Masuk'} <span class="text-rose-400">*</span>
							</label>
							<span class="text-[11px] {quantity < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}">
								{quantity < 0 ? 'Mode Mines / Kurang' : 'Mode Tambah'}
							</span>
						</div>

						<!-- Input with Stepper Buttons -->
						<div class="relative flex items-center">
							<button
								type="button"
								onclick={() => adjustQuantity(-1)}
								class="absolute left-1.5 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
								title="Kurangi 1"
							>
								<Minus class="w-4 h-4" />
							</button>
							<input
								type="number"
								id="quantity"
								name="quantity"
								required
								bind:this={quantityInputRef}
								bind:value={quantity}
								oninput={onQuantityInput}
								class="w-full text-center px-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 transition {quantity < 0
									? 'text-rose-400 border-rose-500/50 focus:ring-rose-500/40 focus:border-rose-500'
									: 'text-emerald-400 border-emerald-500/50 focus:ring-emerald-500/40 focus:border-emerald-500'}"
							/>
							<button
								type="button"
								onclick={() => adjustQuantity(1)}
								class="absolute right-1.5 p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
								title="Tambah 1"
							>
								<Plus class="w-4 h-4" />
							</button>
						</div>

						<!-- Quick Adjust Helper Buttons (Minus and Plus) -->
						<div class="flex items-center justify-between mt-2.5 flex-wrap gap-1.5">
							<!-- Mines helpers -->
							<div class="flex items-center gap-1">
								<span class="text-[10px] text-slate-500 font-semibold mr-0.5">Mines:</span>
								{#each [1, 5, 10, 20] as amt}
									<button
										type="button"
										onclick={() => setDirectQuantity(-amt)}
										class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition cursor-pointer"
									>
										-{amt}
									</button>
								{/each}
							</div>
							<!-- Plus helpers -->
							<div class="flex items-center gap-1">
								<span class="text-[10px] text-slate-500 font-semibold mr-0.5">Plus:</span>
								{#each [1, 5, 10, 20, 50] as amt}
									<button
										type="button"
										onclick={() => setDirectQuantity(amt)}
										class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
									>
										+{amt}
									</button>
								{/each}
							</div>
						</div>

						{#if selectedProduct && (selectedProduct.stock + quantity < 0)}
							<div class="mt-2 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
								<AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
								<span>Pengurangan melebihi stok yang ada ({selectedProduct.stock} {selectedProduct.unit})!</span>
							</div>
						{/if}
					</div>

					<div>
						<label for="purchase_price" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
							Harga Modal (per unit) <span class="text-rose-400">*</span>
						</label>
						<input
							type="number"
							id="purchase_price"
							name="purchase_price"
							min="0"
							step="500"
							required
							bind:value={purchasePrice}
							class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
						/>
						<p class="text-[11px] text-slate-400 mt-1 font-mono">
							{quantity < 0 ? 'Total Nilai Pengurangan:' : 'Total Modal Masuk:'}
							<strong class="{quantity < 0 ? 'text-rose-400' : 'text-white'} font-bold">
								{quantity < 0 ? '-' : ''}{formatRupiah((purchasePrice || 0) * Math.abs(quantity || 0))}
							</strong>
						</p>
					</div>
				</div>
			</div>

			<!-- Note / Supplier Remarks -->
			<div>
				<label for="note" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
					Catatan / Alasan {quantity < 0 ? 'Koreksi' : 'Pemasukan'} (Opsional)
				</label>
				<input
					type="text"
					id="note"
					name="note"
					bind:value={note}
					placeholder={quantity < 0 ? 'Contoh: Koreksi salah input kelebihan stok saat restock tadi' : 'Contoh: Restock batch September dari Distributor Jaya'}
					class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Submit Button -->
			<div class="pt-4 border-t border-slate-800 flex justify-end">
				<button
					type="submit"
					disabled={isSubmitting || !selectedProductId || quantity === 0 || (selectedProduct && selectedProduct.stock + quantity < 0)}
					class="px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed {quantity < 0
						? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-rose-500/20'
						: 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20'}"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
						<span>{quantity < 0 ? 'Menyimpan Koreksi...' : 'Menyimpan Barang Masuk...'}</span>
					{:else if quantity < 0}
						<Minus class="w-4 h-4" />
						<span>Simpan Koreksi Stok ({quantity} {selectedProduct?.unit || 'unit'})</span>
					{:else}
						<CheckCircle2 class="w-4 h-4" />
						<span>Simpan Barang Masuk (+{quantity} {selectedProduct?.unit || 'unit'})</span>
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>


