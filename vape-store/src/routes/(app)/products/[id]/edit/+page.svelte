<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import { enhance } from '$app/forms';
	import { showToast } from '$lib/components/ui/Toast.svelte';
	import {
		Package,
		UploadCloud,
		X,
		ArrowLeft,
		CheckCircle2,
		AlertCircle,
		Droplets,
		Zap,
		Cpu,
		Layers
	} from 'lucide-svelte';

	let { data, form } = $props();
	const prod = $derived(data.product);

	let photoUrl = $state<string | null>(prod.photo);
	let isUploading = $state(false);
	let isSubmitting = $state(false);

	let selectedCategory = $state<'device' | 'liquid' | 'coil' | 'catridge' | 'other'>(prod.category);
	let unit = $state<string>(prod.unit || 'pcs');

	function selectCategory(cat: 'device' | 'liquid' | 'coil' | 'catridge' | 'other') {
		selectedCategory = cat;
		if (cat === 'liquid') {
			unit = 'bottle';
			if (!volumeMl) volumeMl = 30;
		} else if (unit === 'bottle') {
			unit = 'pcs';
		}
	}

	function onUnitChange(newUnit: string) {
		unit = newUnit;
		if (newUnit === 'bottle') {
			selectedCategory = 'liquid';
			if (!volumeMl) volumeMl = 30;
		}
	}

	let nicotineMg = $state<number | string>(prod.nicotine_mg ?? '');
	let volumeMl = $state<number | string>(prod.volume_ml ?? 30);

	let purchasePrice = $state<number>(Number(prod.purchase_price) || 0);
	let sellingPrice = $state<number>(Number(prod.selling_price) || 0);

	function formatRupiah(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount || 0);
	}

	let isDragging = $state(false);

	async function uploadFile(file: File) {
		if (!file.type.startsWith('image/')) {
			showToast('File harus berupa format gambar (JPG, PNG, WEBP).', 'error');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			showToast('Ukuran foto melebihi batas 5MB.', 'error');
			return;
		}

		const formData = new FormData();
		formData.append('photo', file);

		isUploading = true;
		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});
			const resData = await res.json();
			if (!res.ok) {
				showToast(resData.error || 'Gagal mengunggah foto', 'error');
			} else {
				photoUrl = resData.url;
				showToast('Foto berhasil ditempel & diunggah!', 'success');
			}
		} catch (err) {
			showToast('Koneksi upload bermasalah', 'error');
		} finally {
			isUploading = false;
		}
	}

	async function handlePhotoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		await uploadFile(file);
		target.value = '';
	}

	function handleWindowPaste(event: ClipboardEvent) {
		const items = event.clipboardData?.items;
		if (items) {
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.type.startsWith('image/')) {
					const file = item.getAsFile();
					if (file) {
						event.preventDefault();
						uploadFile(file);
						return;
					}
				}
			}
		}

		if (event.clipboardData?.files?.length) {
			const file = event.clipboardData.files[0];
			if (file && file.type.startsWith('image/')) {
				event.preventDefault();
				uploadFile(file);
				return;
			}
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('image/')) {
			uploadFile(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	function removePhoto() {
		photoUrl = null;
	}
</script>

<svelte:window onpaste={handleWindowPaste} />

<svelte:head>
	<title>Edit Produk - {prod.name} - SS VAPE</title>
</svelte:head>

<Header title="Edit Produk Vape" />

<div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-5 sm:space-y-6">
	<div class="flex items-center justify-between">
		<a
			href="/products"
			class="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
		>
			<ArrowLeft class="w-4 h-4" />
			<span>Kembali ke Katalog Produk</span>
		</a>
		<div class="flex items-center gap-2">
			<span class="text-xs text-slate-500">SKU Saat Ini:</span>
			<span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
				{prod.sku}
			</span>
			{#if selectedCategory !== prod.category}
				<span class="text-[11px] text-amber-400 font-semibold font-mono animate-pulse">
					&rarr; (akan diperbarui otomatis)
				</span>
			{/if}
		</div>
	</div>

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
			<input type="hidden" name="photo" value={photoUrl || ''} />

			<input type="hidden" name="category" value={selectedCategory} />

			<!-- Category Selector (Editable) -->
			<div class="space-y-2">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<label class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
						Kategori Produk Vape <span class="text-rose-400">*</span>
					</label>
					{#if selectedCategory !== prod.category}
						<span class="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
							<span>Kategori diubah:</span>
							<strong class="uppercase">{prod.category} &rarr; {selectedCategory}</strong>
							<span class="text-[10px] text-slate-400">(SKU otomatis diperbarui)</span>
						</span>
					{/if}
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
					<!-- Device -->
					<button
						type="button"
						onclick={() => selectCategory('device')}
						class="p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 {selectedCategory === 'device' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}"
					>
						<Cpu class="w-6 h-6 {selectedCategory === 'device' ? 'text-emerald-400' : 'text-slate-500'}" />
						<span class="font-bold text-xs">DEVICE</span>
						<span class="text-[10px] text-slate-500">DEV-XXXX</span>
					</button>

					<!-- Liquid -->
					<button
						type="button"
						onclick={() => selectCategory('liquid')}
						class="p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 {selectedCategory === 'liquid' ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}"
					>
						<Droplets class="w-6 h-6 {selectedCategory === 'liquid' ? 'text-cyan-400' : 'text-slate-500'}" />
						<span class="font-bold text-xs">LIQUID</span>
						<span class="text-[10px] text-slate-500">LIQ-XXXX</span>
					</button>

					<!-- Coil -->
					<button
						type="button"
						onclick={() => selectCategory('coil')}
						class="p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 {selectedCategory === 'coil' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}"
					>
						<Zap class="w-6 h-6 {selectedCategory === 'coil' ? 'text-indigo-400' : 'text-slate-500'}" />
						<span class="font-bold text-xs">COIL</span>
						<span class="text-[10px] text-slate-500">COI-XXXX</span>
					</button>

					<!-- Catridge -->
					<button
						type="button"
						onclick={() => selectCategory('catridge')}
						class="p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 {selectedCategory === 'catridge' ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}"
					>
						<Layers class="w-6 h-6 {selectedCategory === 'catridge' ? 'text-amber-400' : 'text-slate-500'}" />
						<span class="font-bold text-xs">CATRIDGE</span>
						<span class="text-[10px] text-slate-500">CAT-XXXX</span>
					</button>

					<!-- Lainnya -->
					<button
						type="button"
						onclick={() => selectCategory('other')}
						class="p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-2 col-span-2 sm:col-span-1 {selectedCategory === 'other' ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}"
					>
						<Package class="w-6 h-6 {selectedCategory === 'other' ? 'text-purple-400' : 'text-slate-500'}" />
						<span class="font-bold text-xs">LAINNYA</span>
						<span class="text-[10px] text-slate-500">OTH-XXXX</span>
					</button>
				</div>
			</div>

			<!-- Photo Upload Section -->
			<div>
				<label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
					Foto Produk
				</label>
				<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
					{#if photoUrl}
						<div
							class="relative w-28 h-28 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 shadow-md group shrink-0"
							ondrop={handleDrop}
							ondragover={handleDragOver}
							ondragleave={handleDragLeave}
							role="region"
							aria-label="Area foto produk"
						>
							<img src={photoUrl} alt="Preview Foto" class="w-full h-full object-cover" />
							<button
								type="button"
								onclick={removePhoto}
								class="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white transition cursor-pointer"
								title="Hapus foto"
							>
								<X class="w-3.5 h-3.5" />
							</button>
						</div>
					{:else}
						<div
							ondrop={handleDrop}
							ondragover={handleDragOver}
							ondragleave={handleDragLeave}
							role="region"
							aria-label="Area upload foto produk"
							class="w-28 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 shrink-0 {isDragging ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 scale-105 shadow-lg shadow-emerald-500/20' : 'border-slate-700 bg-slate-950/50 text-slate-500 hover:border-slate-600'}"
						>
							<Package class="w-8 h-8 mb-1 {isDragging ? 'text-emerald-400 animate-bounce' : ''}" />
							<span class="text-[10px] text-center font-medium px-1">
								{isDragging ? 'Lepas di sini' : 'Paste / Drop'}
							</span>
						</div>
					{/if}

					<div class="flex-1 space-y-2">
						<div class="flex flex-wrap items-center gap-2">
							<label class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition cursor-pointer">
								<UploadCloud class="w-4 h-4 text-emerald-400" />
								<span>{photoUrl ? 'Ganti Foto' : 'Pilih File'}</span>
								<input
									type="file"
									accept="image/png,image/jpeg,image/jpg,image/webp"
									onchange={handlePhotoUpload}
									class="hidden"
									disabled={isUploading}
								/>
							</label>
							<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
								<kbd class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-emerald-400 font-bold shadow-xs">Ctrl + V</kbd>
								<span>Bisa langsung paste screenshot / copy gambar</span>
							</div>
						</div>
						{#if isUploading}
							<p class="text-[11px] text-emerald-400 font-semibold animate-pulse">Mengunggah file foto dari clipboard...</p>
						{:else}
							<p class="text-[11px] text-slate-500">Mendukung format JPG, PNG, atau WEBP (Maksimal 5MB). Cukup Copy (Ctrl + C) gambar lalu Paste (Ctrl + V) di halaman ini.</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- General Fields: Name & Unit -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div class="sm:col-span-2">
					<label for="name" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
						Nama Produk <span class="text-rose-400">*</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						value={prod.name}
						class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
					/>
				</div>

				<div>
					<div class="flex items-center justify-between mb-1.5">
						<label for="unit" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
							Satuan Unit
						</label>
						{#if unit === 'bottle'}
							<span class="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
								<Droplets class="w-3 h-3" />
								<span>Otomatis Liquid</span>
							</span>
						{/if}
					</div>
					<div class="space-y-2">
						<select
							id="unit"
							name="unit"
							bind:value={unit}
							onchange={(e) => onUnitChange(e.currentTarget.value)}
							class="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
						>
							<option value="pcs">pcs</option>
							<option value="bottle">bottle / botol</option>
							<option value="box">box</option>
							<option value="pack">pack</option>
						</select>

						<!-- Quick Pill Buttons for Unit -->
						<div class="flex flex-wrap gap-1.5">
							{#each [
								{ value: 'pcs', label: 'pcs' },
								{ value: 'bottle', label: 'bottle / botol' },
								{ value: 'box', label: 'box' },
								{ value: 'pack', label: 'pack' }
							] as u}
								<button
									type="button"
									onclick={() => onUnitChange(u.value)}
									class="px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer {unit === u.value
										? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
										: 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'}"
								>
									{u.label}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Category Specific Fields -->
			{#if selectedCategory === 'liquid'}
				<div class="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-4">
					<h3 class="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
						<Droplets class="w-4 h-4" />
						Spesifikasi Khusus Liquid
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label for="liquid_type" class="block text-xs font-medium text-slate-300 mb-1">
								Tipe Liquid
							</label>
							<select
								id="liquid_type"
								name="liquid_type"
								value={prod.liquid_type || 'Saltnic'}
								class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
							>
								<option value="Saltnic">Saltnic</option>
								<option value="Freebase">Freebase</option>
							</select>
						</div>

						<div>
							<label for="nicotine_mg" class="block text-xs font-medium text-slate-300 mb-1">
								Kadar Nikotin (mg)
							</label>
							<input
								type="number"
								id="nicotine_mg"
								name="nicotine_mg"
								bind:value={nicotineMg}
								min="0"
								placeholder="Pilih atau ketik mg..."
								class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
							/>
							<!-- Quick Select Buttons for mg: 3, 6, 7, 9, 15, 30 -->
							<div class="mt-2 space-y-1">
								<span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pilihan Cepat (mg):</span>
								<div class="flex flex-wrap items-center gap-1.5">
									{#each [3, 6, 7, 9, 15, 30] as mgVal}
										<button
											type="button"
											onclick={() => (nicotineMg = mgVal)}
											class="px-2 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer {Number(nicotineMg) === mgVal ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400' : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800'}"
										>
											{mgVal}mg
										</button>
									{/each}
								</div>
							</div>
						</div>

						<div>
							<label for="volume_ml" class="block text-xs font-medium text-slate-300 mb-1">
								Volume (ml)
							</label>
							<input
								type="number"
								id="volume_ml"
								name="volume_ml"
								bind:value={volumeMl}
								min="1"
								placeholder="Pilih atau ketik ml..."
								class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
							/>
							<!-- Quick Select Buttons for ml: 15, 30, 60 -->
							<div class="mt-2 space-y-1">
								<span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pilihan Cepat (ml):</span>
								<div class="flex flex-wrap items-center gap-1.5">
									{#each [15, 30, 60] as mlVal}
										<button
											type="button"
											onclick={() => (volumeMl = mlVal)}
											class="px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer {Number(volumeMl) === mlVal ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400' : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800'}"
										>
											{mlVal}ml
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else if selectedCategory === 'catridge'}
				<div class="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-4">
					<h3 class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
						<Layers class="w-4 h-4" />
						Spesifikasi Khusus Catridge
					</h3>
					<div>
						<label for="resistance_ohm" class="block text-xs font-medium text-slate-300 mb-1">
							Nilai Resistance / Ohm
						</label>
						<input
							type="text"
							id="resistance_ohm"
							name="resistance_ohm"
							value={prod.resistance_ohm || ''}
							placeholder="Misal: 0.8Ω"
							class="w-full sm:w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
						/>
					</div>
				</div>
			{/if}

			<!-- Pricing -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="purchase_price" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
						Harga Modal (Beli) <span class="text-rose-400">*</span>
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
					<p class="text-[11px] text-slate-500 mt-1 font-mono">{formatRupiah(purchasePrice)}</p>
				</div>

				<div>
					<label for="selling_price" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
						Harga Jual <span class="text-rose-400">*</span>
					</label>
					<input
						type="number"
						id="selling_price"
						name="selling_price"
						min="0"
						step="500"
						required
						bind:value={sellingPrice}
						class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
					/>
					<p class="text-[11px] text-emerald-400/80 mt-1 font-mono">{formatRupiah(sellingPrice)}</p>
				</div>
			</div>

			<!-- Current Stock Notice (Stock should be modified via Stock IN or Mutations) -->
			<div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
				<div>
					<span class="text-xs font-bold text-slate-300">Stok Saat Ini:</span>
					<span class="ml-2 font-mono text-emerald-400 font-bold">{prod.stock} {prod.unit}</span>
				</div>
				<a href="/stock/in" class="text-xs text-emerald-400 hover:underline font-semibold">
					+ Tambah Stok di Barang Masuk
				</a>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
					Deskripsi Produk
				</label>
				<textarea
					id="description"
					name="description"
					rows="3"
					class="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
				>{prod.description || ''}</textarea>
			</div>

			<!-- Status Toggle -->
			<div class="flex items-center gap-4 pt-2">
				<label class="text-xs font-bold text-slate-300 uppercase tracking-wider">Status:</label>
				<label class="inline-flex items-center gap-2 cursor-pointer">
					<input type="radio" name="status" value="active" checked={prod.status === 'active'} class="accent-emerald-500" />
					<span class="text-xs text-emerald-400 font-semibold">Aktif</span>
				</label>
				<label class="inline-flex items-center gap-2 cursor-pointer">
					<input type="radio" name="status" value="inactive" checked={prod.status === 'inactive'} class="accent-slate-500" />
					<span class="text-xs text-slate-400">Nonaktif</span>
				</label>
			</div>

			<!-- Submit & Cancel -->
			<div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
				<a
					href="/products"
					class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
				>
					Batal
				</a>
				<button
					type="submit"
					disabled={isSubmitting || isUploading}
					class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<div class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
						<span>Menyimpan Perubahan...</span>
					{:else}
						<span>Simpan Perubahan</span>
						<CheckCircle2 class="w-4 h-4" />
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
