import { Observable, EventData, Page } from '@nativescript/core';
import { ReportService } from '../../services/report.service';
import { goBack, showError, showSuccess } from '../../utils/dialogs.helper';

export class SettingsViewModel extends Observable {
  private _storeName: string = '';
  private _address: string = '';
  private _phone: string = '';
  private _invoiceFooter: string = '';
  private _lowStockThreshold: string = '5';
  private _isLoading: boolean = false;
  private _isSaving: boolean = false;
  private _errorMessage: string = '';

  constructor() {
    super();
    this.loadSettings();
  }

  get storeName(): string { return this._storeName; }
  set storeName(val: string) { this._storeName = val; this.notifyPropertyChange('storeName', val); }
  get address(): string { return this._address; }
  set address(val: string) { this._address = val; this.notifyPropertyChange('address', val); }
  get phone(): string { return this._phone; }
  set phone(val: string) { this._phone = val; this.notifyPropertyChange('phone', val); }
  get invoiceFooter(): string { return this._invoiceFooter; }
  set invoiceFooter(val: string) { this._invoiceFooter = val; this.notifyPropertyChange('invoiceFooter', val); }
  get lowStockThreshold(): string { return this._lowStockThreshold; }
  set lowStockThreshold(val: string) { this._lowStockThreshold = val; this.notifyPropertyChange('lowStockThreshold', val); }
  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) { this._isLoading = val; this.notifyPropertyChange('isLoading', val); }
  get isSaving(): boolean { return this._isSaving; }
  set isSaving(val: boolean) { this._isSaving = val; this.notifyPropertyChange('isSaving', val); }
  get errorMessage(): string { return this._errorMessage; }
  set errorMessage(val: string) { this._errorMessage = val; this.notifyPropertyChange('errorMessage', val); }

  async loadSettings(): Promise<void> {
    this.isLoading = true;
    try {
      const s = await ReportService.getSettings();
      this.storeName = s.store_name || 'SS VAPE';
      this.address = s.address || '';
      this.phone = s.phone || '';
      this.invoiceFooter = s.invoice_footer || '';
      this.lowStockThreshold = String(s.low_stock_threshold || 5);
    } catch (err: any) {
      this.errorMessage = err.message || 'Gagal memuat pengaturan.';
    } finally {
      this.isLoading = false;
    }
  }

  async save(): Promise<void> {
    this.errorMessage = '';
    this.isSaving = true;
    try {
      await ReportService.updateSettings({
        store_name: this._storeName,
        address: this._address || null,
        phone: this._phone || null,
        invoice_footer: this._invoiceFooter,
        low_stock_threshold: parseInt(this._lowStockThreshold) || 5
      });
      await showSuccess('Pengaturan berhasil disimpan.');
    } catch (err: any) {
      this.errorMessage = err.message || 'Gagal menyimpan.';
    } finally {
      this.isSaving = false;
    }
  }
}

let viewModel: SettingsViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new SettingsViewModel();
  page.bindingContext = viewModel;
}

export function onGoBack(): void { goBack(); }
export function onSave(): void { viewModel.save(); }
