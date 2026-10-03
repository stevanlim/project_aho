import { Observable, EventData, Page, ObservableArray, ItemEventData } from '@nativescript/core';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import { formatRupiah, formatDateTime, getPaymentLabel } from '../../utils/formatters';
import { navigateTo, showError } from '../../utils/dialogs.helper';

interface SaleDisplayItem {
  id: number;
  invoice_number: string;
  formattedTotal: string;
  formattedDate: string;
  paymentLabel: string;
  statusLabel: string;
  statusBadge: string;
  created_by: string;
}

export class TransactionListViewModel extends Observable {
  private _sales: ObservableArray<SaleDisplayItem>;
  private _searchQuery: string = '';
  private _filterPreset: string = '';
  private _isLoading: boolean = false;
  private _totalSales: number = 0;

  constructor() {
    super();
    this._sales = new ObservableArray<SaleDisplayItem>();
    this.loadSales();
  }

  get sales(): ObservableArray<SaleDisplayItem> { return this._sales; }

  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    this._searchQuery = val;
    this.notifyPropertyChange('searchQuery', val);
    this.loadSales();
  }

  get filterPreset(): string { return this._filterPreset; }
  set filterPreset(val: string) {
    this._filterPreset = val;
    this.notifyPropertyChange('filterPreset', val);
    this.loadSales();
  }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    this._isLoading = val;
    this.notifyPropertyChange('isLoading', val);
    this.notifyPropertyChange('isEmpty', this.isEmpty);
  }

  get isEmpty(): boolean {
    return !this._isLoading && this._sales.length === 0;
  }

  get totalSales(): number { return this._totalSales; }
  set totalSales(val: number) { this._totalSales = val; this.notifyPropertyChange('totalSales', val); }

  async loadSales(): Promise<void> {
    this.isLoading = true;
    try {
      const now = new Date();
      const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
      let startDate = '';
      let endDate = '';

      if (this._filterPreset === 'today') {
        startDate = endDate = formatYMD(now);
      } else if (this._filterPreset === 'yesterday') {
        const yd = new Date(now); yd.setDate(now.getDate() - 1);
        startDate = endDate = formatYMD(yd);
      } else if (this._filterPreset === '7days') {
        const sd = new Date(now); sd.setDate(now.getDate() - 7);
        startDate = formatYMD(sd); endDate = formatYMD(now);
      } else if (this._filterPreset === 'thisMonth') {
        startDate = formatYMD(new Date(now.getFullYear(), now.getMonth(), 1));
        endDate = formatYMD(now);
      }

      const result = await SaleService.getSales({
        search: this._searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 50
      });

      const items = (result.sales || []).map(s => ({
        id: s.id,
        invoice_number: s.invoice_number,
        formattedTotal: formatRupiah(s.grand_total),
        formattedDate: formatDateTime(s.created_at),
        paymentLabel: getPaymentLabel(s.payment_method),
        statusLabel: s.status === 'completed' ? 'Selesai' : 'Dibatalkan',
        statusBadge: s.status === 'completed' ? 'badge badge-emerald' : 'badge badge-rose',
        created_by: s.created_by
      }));

      this._sales.splice(0, this._sales.length, ...items);
      this.totalSales = result.total || items.length;
    } catch (err: any) {
      showError(err.message || 'Gagal memuat transaksi.');
    } finally {
      this.isLoading = false;
      this.notifyPropertyChange('isEmpty', this.isEmpty);
    }
  }
}

let viewModel: TransactionListViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new TransactionListViewModel();
  page.bindingContext = viewModel;
}

export function onSaleTap(args: ItemEventData): void {
  const sale = viewModel.sales.getItem(args.index);
  navigateTo('views/transactions/receipt-page', { saleId: sale.id });
}

export function onFilterAll(): void { viewModel.filterPreset = ''; }
export function onFilterToday(): void { viewModel.filterPreset = 'today'; }
export function onFilterYesterday(): void { viewModel.filterPreset = 'yesterday'; }
export function onFilter7Days(): void { viewModel.filterPreset = '7days'; }
export function onFilterThisMonth(): void { viewModel.filterPreset = 'thisMonth'; }
