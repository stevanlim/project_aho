import { Observable, EventData, Page } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';
import { navigateTo, showConfirm } from '../../utils/dialogs.helper';

export class MenuViewModel extends Observable {
  private _userName: string = '';
  private _userRole: string = '';

  constructor() {
    super();
    const user = AuthService.getCurrentUser();
    if (user) {
      this._userName = user.name || user.username;
      this._userRole = user.role === 'admin' ? 'Administrator' : 'Kasir';
    } else {
      this._userName = 'SS VAPE User';
      this._userRole = 'Admin';
    }
  }

  get userName(): string { return this._userName; }
  get userRole(): string { return this._userRole; }

  async logout(): Promise<void> {
    const confirmed = await showConfirm('Yakin ingin keluar dari aplikasi?', 'Logout');
    if (!confirmed) return;

    await AuthService.logout();
    navigateTo('views/auth/login-page', undefined, true);
  }
}

let viewModel: MenuViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new MenuViewModel();
  page.bindingContext = viewModel;
}

export function onStockIn(): void {
  navigateTo('views/stock/stock-in-page');
}

export function onStockMutations(): void {
  navigateTo('views/stock/stock-mutations-page');
}

export function onStockAlerts(): void {
  navigateTo('views/stock/stock-alerts-page');
}

export function onSettings(): void {
  navigateTo('views/settings/settings-page');
}

export function onLogout(): void {
  viewModel.logout();
}
