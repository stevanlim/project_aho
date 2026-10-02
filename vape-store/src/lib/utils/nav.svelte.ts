class MobileNavState {
	isOpen = $state<boolean>(false);

	toggle() {
		this.isOpen = !this.isOpen;
	}

	open() {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}
}

export const mobileNav = new MobileNavState();

export function toggleMobileSidebar() {
	mobileNav.toggle();
}

export function closeMobileSidebar() {
	mobileNav.close();
}

export function openMobileSidebar() {
	mobileNav.open();
}
