import { Observable, EventData, Page, ObservableArray } from '@nativescript/core';
import { StockService } from '../../services/stock.service';
import { formatDateTime } from '../../utils/formatters';
import { goBack, showError } from '../../utils/dialogs.helper';

export class StockMutationsViewModel extends Observable {
  private _mutations: ObservableArray<any>;
  private _typeFilter: string = 'all';
  private _isLoading: boolean = false;

  constructor() {
    super();
    this._mutations = new ObservableArray<any>();
    this.loadMutations();
  }

  get mutations(): ObservableArray<any> { return this._mutations; }
  get typeFilter(): string { return this._typeFilter; }
  set typeFilter(val: string) { this._typeFilter = val; this.notifyPropertyChange('typeFilter', val); this.loadMutations(); }
  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) { this._isLoading = val; this.notifyPropertyChange('isLoading', val); }

  async loadMutations(): Promise<void> {
    this.isLoading = true;
    try {
      const result = await StockService.getMutations({
        type: this._typeFilter !== 'all' ? this._typeFilter : undefined
      });

      const items = (result.mutations || []).map(m => ({
        ...m,
        typeIcon: m.type === 'IN' ? 'IN' : m.type === 'OUT' ? 'OUT' : 'ADJ',
        quantityLabel: (m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '') + m.quantity,
        quantityClass: m.type === 'IN' ? 'text-base font-bold text-emerald' : m.type === 'OUT' ? 'text-base font-bold text-rose' : 'text-base font-bold text-amber',
        formattedDate: formatDateTime(m.created_at)
      }));

      this._mutations.splice(0, this._mutations.length, ...items);
    } catch (err: any) {
      showError(err.message || 'Gagal memuat mutasi stok.');
    } finally {
      this.isLoading = false;
    }
  }
}

let viewModel: StockMutationsViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new StockMutationsViewModel();
  page.bindingContext = viewModel;
}

export function onGoBack(): void { goBack(); }
export function onTypeAll(): void { viewModel.typeFilter = 'all'; }
export function onTypeIn(): void { viewModel.typeFilter = 'IN'; }
export function onTypeOut(): void { viewModel.typeFilter = 'OUT'; }
export function onTypeAdj(): void { viewModel.typeFilter = 'ADJUSTMENT'; }
