import { Observable, EventData, Page, ObservableArray } from '@nativescript/core';
import { StockService } from '../../services/stock.service';
import { goBack, showError } from '../../utils/dialogs.helper';

export class StockAlertsViewModel extends Observable {
  private _alerts: ObservableArray<any>;
  private _isLoading: boolean = false;

  constructor() {
    super();
    this._alerts = new ObservableArray<any>();
    this.loadAlerts();
  }

  get alerts(): ObservableArray<any> { return this._alerts; }
  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    this._isLoading = val;
    this.notifyPropertyChange('isLoading', val);
    this.notifyPropertyChange('isEmpty', this.isEmpty);
  }
  get isEmpty(): boolean {
    return !this._isLoading && this._alerts.length === 0;
  }

  async loadAlerts(): Promise<void> {
    this.isLoading = true;
    try {
      const alerts = await StockService.getAlerts();
      this._alerts.splice(0, this._alerts.length, ...alerts);
    } catch (err: any) {
      showError(err.message || 'Gagal memuat peringatan stok.');
    } finally {
      this.isLoading = false;
      this.notifyPropertyChange('isEmpty', this.isEmpty);
    }
  }
}

let viewModel: StockAlertsViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new StockAlertsViewModel();
  page.bindingContext = viewModel;
}

export function onGoBack(): void { goBack(); }
