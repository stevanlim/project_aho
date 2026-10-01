<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black relative">
	<!-- Responsive Navigation Sidebar (Desktop sticky & Mobile/Tablet off-canvas drawer) -->
	<Sidebar user={data.user} />

	<!-- Main Content Area -->
	<main class="flex-1 flex flex-col min-w-0 overflow-x-hidden">
		{@render children()}
	</main>

	<!-- Global Toast Notifications & Audio Chimes -->
	<Toast />
</div>
