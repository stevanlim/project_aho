import { writable } from 'svelte/store';

export const isMobileSidebarOpen = writable<boolean>(false);

export function toggleMobileSidebar() {
	isMobileSidebarOpen.update((open) => !open);
}

export function closeMobileSidebar() {
	isMobileSidebarOpen.set(false);
}
