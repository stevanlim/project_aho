import { Observable, EventData, Page, Frame } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';
import { navigateTo } from '../../utils/dialogs.helper';
import { isTablet } from '../../utils/device.helper';

export class MainViewModel extends Observable {
  private _activeTab: string = 'pos';
  private _userRole: string = 'kasir';

  constructor() {
    super();
    const user = AuthService.getCurrentUser();
    this._userRole = user?.role || 'kasir';
  }

  get isKasir(): boolean { return this._userRole === 'kasir'; }
  get isAdmin(): boolean { return this._userRole === 'admin'; }

  get activeTab(): string { return this._activeTab; }
  set activeTab(val: string) {
    if (this._activeTab !== val) {
      this._activeTab = val;
      this.notifyPropertyChange('activeTab', val);
    }
  }

  navigateToTab(tab: string, page: Page): void {
    // Restrict kasir from accessing products and menu
    if (this.isKasir && (tab === 'products' || tab === 'menu')) {
      return;
    }

    this.activeTab = tab;
    const frame = page.getViewById('contentFrame') as Frame;
    if (frame) {
      let moduleName = '';
      switch (tab) {
        case 'pos':
          moduleName = isTablet() ? 'views/pos/pos-tablet-page' : 'views/pos/pos-page';
          break;
        case 'products':
          moduleName = 'views/products/product-list-page';
          break;
        case 'transactions':
          moduleName = 'views/transactions/transaction-list-page';
          break;
        case 'reports':
          moduleName = 'views/reports/report-page';
          break;
        case 'menu':
          moduleName = 'views/settings/menu-page';
          break;
      }
      if (moduleName) {
        frame.navigate({
          moduleName,
          clearHistory: true,
          animated: false
        });
      }
    }
  }
}

let viewModel: MainViewModel;
let currentPage: Page;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  currentPage = page;

  // Check if logged in
  if (!AuthService.isLoggedIn()) {
    navigateTo('views/auth/login-page', undefined, true);
    return;
  }

  viewModel = new MainViewModel();
  page.bindingContext = viewModel;
}

export function onLoaded(args: EventData): void {
  const page = args.object as Page;
  if (isTablet()) {
    const frame = page.getViewById('contentFrame') as Frame;
    if (frame) {
      frame.navigate({
        moduleName: 'views/pos/pos-tablet-page',
        clearHistory: true,
        animated: false
      });
    }
  }
}

export function onNavPOS(args: EventData): void {
  viewModel.navigateToTab('pos', currentPage);
}

export function onNavProducts(args: EventData): void {
  viewModel.navigateToTab('products', currentPage);
}

export function onNavTransactions(args: EventData): void {
  viewModel.navigateToTab('transactions', currentPage);
}

export function onNavReports(args: EventData): void {
  viewModel.navigateToTab('reports', currentPage);
}

export function onNavMenu(args: EventData): void {
  viewModel.navigateToTab('menu', currentPage);
}
