import { Observable, EventData, Page, ObservableArray } from '@nativescript/core';
import { SaleService } from '../../services/sale.service';
import { ReportService } from '../../services/report.service';
import { Sale, SaleItem } from '../../models/sale.model';
import { formatRupiah, formatDateTime, getPaymentLabel } from '../../utils/formatters';
import { goBack, showError, showConfirm, showSuccess } from '../../utils/dialogs.helper';

export class ReceiptViewModel extends Observable {
  private _sale: Sale | null = null;
  private _saleItems: ObservableArray<any>;
  private _isLoading: boolean = false;
  private _storeAddress: string = '';
  private _storePhone: string = '';
  private _invoiceFooter: string = '';
  private _formattedDate: string = '';
  private _paymentLabel: string = '';
  private _formattedSubtotal: string = '';
  private _formattedDiscount: string = '';
  private _formattedGrandTotal: string = '';
  private _formattedPaid: string = '';
  private _formattedChange: string = '';

  constructor() {
    super();
    this._saleItems = new ObservableArray<any>();
  }

  get sale(): any { return this._sale || {}; }
  get saleItems(): ObservableArray<any> { return this._saleItems; }
  get isLoading(): boolean { return this._isLoading; }
  get storeAddress(): string { return this._storeAddress; }
  get storePhone(): string { return this._storePhone; }
  get invoiceFooter(): string { return this._invoiceFooter; }
  get formattedDate(): string { return this._formattedDate; }
  get paymentLabel(): string { return this._paymentLabel; }
  get formattedSubtotal(): string { return this._formattedSubtotal; }
  get formattedDiscount(): string { return this._formattedDiscount; }
  get formattedGrandTotal(): string { return this._formattedGrandTotal; }
  get formattedPaid(): string { return this._formattedPaid; }
  get formattedChange(): string { return this._formattedChange; }

  async load(saleId: number): Promise<void> {
    this._isLoading = true;
    this.notifyPropertyChange('isLoading', true);

    try {
      const [sale, settings] = await Promise.all([
        SaleService.getSaleById(saleId),
        ReportService.getSettings()
      ]);

      this._sale = sale;
      this._storeAddress = settings.address || '';
      this._storePhone = settings.phone ? `Tel: ${settings.phone}` : '';
      this._invoiceFooter = settings.invoice_footer || 'Terima kasih atas kunjungan Anda!';
      this._formattedDate = formatDateTime(sale.created_at);
      this._paymentLabel = getPaymentLabel(sale.payment_method);
      this._formattedSubtotal = formatRupiah(sale.subtotal);
      this._formattedDiscount = formatRupiah(sale.discount);
      this._formattedGrandTotal = formatRupiah(sale.grand_total);
      this._formattedPaid = formatRupiah(sale.paid_amount);
      this._formattedChange = formatRupiah(sale.change_amount);

      const items = (sale.items || []).map(item => ({
        ...item,
        formattedUnitPrice: formatRupiah(item.unit_price),
        formattedSubtotal: formatRupiah(item.subtotal)
      }));
      this._saleItems.splice(0, this._saleItems.length, ...items);

      // Notify all properties
      ['sale', 'storeAddress', 'storePhone', 'invoiceFooter', 'formattedDate',
        'paymentLabel', 'formattedSubtotal', 'formattedDiscount', 'formattedGrandTotal',
        'formattedPaid', 'formattedChange'].forEach(p => this.notifyPropertyChange(p, (this as any)[p]));
    } catch (err: any) {
      showError(err.message || 'Gagal memuat detail transaksi.');
    } finally {
      this._isLoading = false;
      this.notifyPropertyChange('isLoading', false);
    }
  }

  getFormattedReceiptText(): string {
    if (!this._sale) return '';
    let text = `================================\n`;
    text += `           SS VAPE\n`;
    if (this._storeAddress) text += `${this._storeAddress}\n`;
    if (this._storePhone) text += `${this._storePhone}\n`;
    text += `================================\n`;
    text += `Invoice   : ${this._sale.invoice_number}\n`;
    text += `Tanggal   : ${this._formattedDate}\n`;
    text += `Kasir     : ${this._sale.created_by}\n`;
    text += `Bayar     : ${this._paymentLabel}\n`;
    text += `--------------------------------\n`;

    for (let i = 0; i < this._saleItems.length; i++) {
      const it = this._saleItems.getItem(i);
      text += `${it.product_name}\n`;
      text += `  ${it.quantity} x ${it.formattedUnitPrice} = ${it.formattedSubtotal}\n`;
    }

    text += `--------------------------------\n`;
    text += `Subtotal  : ${this._formattedSubtotal}\n`;
    if (this._sale.discount > 0) {
      text += `Diskon    : -${this._formattedDiscount}\n`;
    }
    text += `TOTAL     : ${this._formattedGrandTotal}\n`;
    text += `Bayar     : ${this._formattedPaid}\n`;
    text += `Kembalian : ${this._formattedChange}\n`;
    text += `================================\n`;
    text += `  ${this._invoiceFooter}\n`;
    text += `================================\n`;
    return text;
  }

  async printReceipt(): Promise<void> {
    const receiptText = this.getFormattedReceiptText();
    if (!receiptText) return;

    await showSuccess(
      `Struk ${this._sale.invoice_number} siap dicetak!\n\n${receiptText}`,
      'Cetak Struk Sukses'
    );
  }

  async shareReceipt(): Promise<void> {
    const receiptText = this.getFormattedReceiptText();
    if (!receiptText) return;

    await showSuccess(
      receiptText,
      'Format Struk Transaksi'
    );
  }

  async deleteSale(): Promise<void> {
    if (!this._sale) return;
    const confirmed = await showConfirm(
      `Hapus transaksi ${this._sale.invoice_number}?\nStok barang akan dikembalikan.`,
      'Konfirmasi Hapus'
    );
    if (!confirmed) return;

    try {
      await SaleService.deleteSale(this._sale.id);
      await showSuccess('Transaksi berhasil dihapus dan stok dikembalikan.');
      goBack();
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus transaksi.');
    }
  }
}

let viewModel: ReceiptViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new ReceiptViewModel();
  page.bindingContext = viewModel;

  const context = page.navigationContext;
  if (context?.saleId) {
    viewModel.load(context.saleId);
  }
}

export function onGoBack(): void { goBack(); }

export function onPrintReceipt(): void { viewModel.printReceipt(); }

export function onShareReceipt(): void { viewModel.shareReceipt(); }

export function onDeleteSale(): void { viewModel.deleteSale(); }

