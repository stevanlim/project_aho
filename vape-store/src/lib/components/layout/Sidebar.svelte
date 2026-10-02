<script lang="ts">
	import { page } from '$app/state';
	import { mobileNav, closeMobileSidebar } from '$lib/utils/nav.js';
	import {
		LayoutDashboard,
		Package,
		Boxes,
		ShoppingCart,
		Receipt,
		BarChart3,
		Settings,
		LogOut,
		PlusCircle,
		List,
		ArrowDownToLine,
		History,
		TrendingUp,
		FileSpreadsheet,
		UserCircle,
		ChevronDown,
		AlertTriangle,
		X
	} from 'lucide-svelte';

	let { user } = $props<{ user?: { username: string; name: string; role: string } | null }>();

	const isAdmin = $derived(user?.role === 'admin');

	let productsOpen = $state(true);
	let stockOpen = $state(true);
	let reportsOpen = $state(true);

	const currentPath = $derived(page.url.pathname);

	// Auto-close sidebar on route navigation
	$effect(() => {
		if (currentPath) {
			closeMobileSidebar();
		}
	});

	function isActive(path: string, exact = false) {
		if (exact) return currentPath === path;
		return currentPath === path || currentPath.startsWith(path + '/');
	}
</script>

<!-- Mobile & Tablet Backdrop Overlay -->
{#if mobileNav.isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
		onclick={closeMobileSidebar}
	></div>
{/if}

<aside
	class="w-64 bg-[#0c1220] border-r border-slate-800/80 flex flex-col h-screen shrink-0 select-none z-50 fixed lg:sticky top-0 left-0 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none {mobileNav.isOpen ? 'mobile-nav-visible' : 'mobile-nav-hidden'}"
>
	<!-- Branding Header -->
	<div class="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 gap-3">
		<div class="flex items-center gap-3 overflow-hidden">
			<div class="w-10 h-10 rounded-xl bg-white p-0.5 border border-emerald-500/30 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 overflow-hidden">
				<img src="/images/logo.png" alt="Logo SS VAPE" class="w-full h-full object-contain rounded-lg" />
			</div>
			<div class="overflow-hidden">
				<h1 class="font-extrabold text-base tracking-wider text-white flex items-center gap-1">
					SS <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">VAPE</span>
				</h1>
				<span class="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase truncate block">Teluk Batang</span>
			</div>
		</div>

		<!-- Mobile Close Button -->
		<button
			type="button"
			class="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition cursor-pointer touch-manipulation"
			onclick={closeMobileSidebar}
			aria-label="Tutup menu sidebar"
		>
			<X class="w-5 h-5" />
		</button>
	</div>

	<!-- Navigation Links -->
	<div class="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
		<!-- Dashboard (ADMIN ONLY) -->
		{#if isAdmin}
			<a
				href="/dashboard"
				onclick={closeMobileSidebar}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 {isActive('/dashboard', true) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"
			>
				<LayoutDashboard class="w-4 h-4" />
				<span>Dashboard</span>
			</a>
		{/if}

		<!-- Kasir POS (High Priority for Tablet) -->
		<a
			href="/pos"
			onclick={closeMobileSidebar}
			class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-150 {isActive('/pos') ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
		>
			<ShoppingCart class="w-4 h-4 text-emerald-400" />
			<span class="flex-1">Kasir POS</span>
			<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">SALE</span>
		</a>

		<!-- Riwayat Transaksi -->
		<a
			href="/transactions"
			onclick={closeMobileSidebar}
			class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 {isActive('/transactions') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"
		>
			<Receipt class="w-4 h-4" />
			<span>Riwayat Transaksi</span>
		</a>

		<!-- Mutasi Pendapatan (Direct top-level for Kasir) -->
		{#if !isAdmin}
			<a
				href="/reports/sales"
				onclick={closeMobileSidebar}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 {isActive('/reports/sales') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"
			>
				<FileSpreadsheet class="w-4 h-4 text-cyan-400" />
				<span>Mutasi Pendapatan</span>
			</a>
		{/if}

		<!-- Section: Manajemen Produk (ADMIN ONLY) -->
		{#if isAdmin}
			<div class="pt-2">
				<button
					type="button"
					onclick={() => (productsOpen = !productsOpen)}
					class="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition"
				>
					<span class="flex items-center gap-2">
						<Package class="w-3.5 h-3.5" />
						<span>Produk</span>
					</span>
					<ChevronDown class="w-3.5 h-3.5 transition-transform duration-200 {productsOpen ? 'rotate-180' : ''}" />
				</button>

				{#if productsOpen}
					<div class="mt-1 pl-4 space-y-1 border-l border-slate-800/80 ml-4">
						<a
							href="/products"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {isActive('/products', true) ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}"
						>
							<List class="w-3.5 h-3.5" />
							<span>Daftar Produk</span>
						</a>
						<a
							href="/products/new"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {isActive('/products/new') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}"
						>
							<PlusCircle class="w-3.5 h-3.5" />
							<span>Tambah Produk</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Section: Inventaris & Stok (ADMIN ONLY) -->
		{#if isAdmin}
			<div class="pt-2">
				<button
					type="button"
					onclick={() => (stockOpen = !stockOpen)}
					class="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition"
				>
					<span class="flex items-center gap-2">
						<Boxes class="w-3.5 h-3.5" />
						<span>Stok & Mutasi</span>
					</span>
					<ChevronDown class="w-3.5 h-3.5 transition-transform duration-200 {stockOpen ? 'rotate-180' : ''}" />
				</button>

				{#if stockOpen}
					<div class="mt-1 pl-4 space-y-1 border-l border-slate-800/80 ml-4">
						<a
							href="/stock/in"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {isActive('/stock/in') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}"
						>
							<ArrowDownToLine class="w-3.5 h-3.5" />
							<span>Stok Masuk</span>
						</a>
						<a
							href="/stock/alerts"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {isActive('/stock/alerts') ? 'text-amber-400 bg-amber-500/10 font-bold' : 'text-slate-400 hover:text-white'}"
						>
							<AlertTriangle class="w-3.5 h-3.5 text-amber-400" />
							<span>Stok Habis & Menipis</span>
						</a>
						<a
							href="/stock/mutations"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {isActive('/stock/mutations') ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}"
						>
							<History class="w-3.5 h-3.5" />
							<span>Riwayat Mutasi</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Section: Laporan (ADMIN ONLY) -->
		{#if isAdmin}
			<div class="pt-2">
				<button
					type="button"
					onclick={() => (reportsOpen = !reportsOpen)}
					class="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition"
				>
					<span class="flex items-center gap-2">
						<BarChart3 class="w-3.5 h-3.5" />
						<span>Laporan</span>
					</span>
					<ChevronDown class="w-3.5 h-3.5 transition-transform duration-200 {reportsOpen ? 'rotate-180' : ''}" />
				</button>

				{#if reportsOpen}
					<div class="mt-1 pl-4 space-y-1 border-l border-slate-800/80 ml-4">
						<a
							href="/reports"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {isActive('/reports', true) ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}"
						>
							<TrendingUp class="w-3.5 h-3.5" />
							<span>Laporan Keuangan</span>
						</a>
						<a
							href="/reports/sales"
							onclick={closeMobileSidebar}
							class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition {currentPath === '/reports/sales' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'}"
						>
							<FileSpreadsheet class="w-3.5 h-3.5" />
							<span>Mutasi Pendapatan</span>
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Settings (ADMIN ONLY) -->
		{#if isAdmin}
			<a
				href="/settings"
				onclick={closeMobileSidebar}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 {isActive('/settings') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}"
			>
				<Settings class="w-4 h-4" />
				<span>Pengaturan</span>
			</a>
		{/if}
	</div>

	<!-- Bottom Section: User Profile & Logout -->
	<div class="p-3 border-t border-slate-800/80 bg-slate-900/40">
		<div class="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800/80">
			<div class="flex items-center gap-2.5 overflow-hidden">
				<div class="w-8 h-8 rounded-lg {isAdmin ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'} flex items-center justify-center border shrink-0">
					<UserCircle class="w-5 h-5" />
				</div>
				<div class="truncate">
					<p class="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
					<div class="flex items-center gap-1.5">
						<span class="text-[10px] {isAdmin ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' : 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'} px-1.5 py-0 rounded font-bold uppercase border">
							{user?.role || 'admin'}
						</span>
					</div>
				</div>
			</div>
			<a
				href="/logout"
				data-sveltekit-reload
				title="Keluar / Logout"
				class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition duration-150 cursor-pointer"
			>
				<LogOut class="w-4 h-4" />
			</a>
		</div>
	</div>
</aside>

