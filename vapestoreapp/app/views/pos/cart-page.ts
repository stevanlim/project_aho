import { Observable, EventData, Page, ObservableArray } from '@nativescript/core';
import { PosService } from '../../services/pos.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { CartItem, PaymentMethod } from '../../models/sale.model';
import { formatRupiah } from '../../utils/formatters';
import { goBack, showError, showSuccess, showConfirm, navigateTo } from '../../utils/dialogs.helper';

export interface CartDisplayItem extends CartItem {
  formattedUnitPrice: string;
  formattedSubtotal: string;
  photoPath: string;
}

export class CartViewModel extends Observable {
  private _cartItems: ObservableArray<CartDisplayItem>;
  private _paymentMethod: PaymentMethod = 'Cash';
  private _discountInput: string = '0';
  private _paidAmountInput: string = '';
  private _isProcessing: boolean = false;

  constructor() {
    super();
    this._cartItems = new ObservableArray<CartDisplayItem>();
    this.refreshCart();
  }

  get cartItems(): ObservableArray<CartDisplayItem> { return this._cartItems; }

  get isEmptyCart(): boolean { return this._cartItems.length === 0; }
  get hasCartItems(): boolean { return this._cartItems.length > 0; }
  get isCashPayment(): boolean { return this._paymentMethod === 'Cash'; }

  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  set paymentMethod(val: PaymentMethod) {
    if (this._paymentMethod !== val) {
      this._paymentMethod = val;
      this.notifyPropertyChange('paymentMethod', val);
      this.notifyPropertyChange('isCashPayment', this.isCashPayment);
      if (val !== 'Cash') {
        const discount = parseFloat(this._discountInput) || 0;
        const totals = PosService.getCartTotals(discount);
        this.paidAmountInput = String(totals.grandTotal);
      }
    }
  }

  get discountInput(): string { return this._discountInput; }
  set discountInput(val: string) {
    if (this._discountInput !== val) {
      this._discountInput = val;
      this.notifyPropertyChange('discountInput', val);
      this.updateTotals();
    }
  }

  get paidAmountInput(): string { return this._paidAmountInput; }
  set paidAmountInput(val: string) {
    if (this._paidAmountInput !== val) {
      this._paidAmountInput = val;
      this.notifyPropertyChange('paidAmountInput', val);
      this.notifyPropertyChange('formattedChange', this.formattedChange);
    }
  }

  get isProcessing(): boolean { return this._isProcessing; }
  set isProcessing(val: boolean) {
    if (this._isProcessing !== val) {
      this._isProcessing = val;
      this.notifyPropertyChange('isProcessing', val);
    }
  }

  get formattedSubtotal(): string {
    const totals = PosService.getCartTotals();
    return formatRupiah(totals.subtotal);
  }

  get formattedGrandTotal(): string {
    const discount = parseFloat(this._discountInput) || 0;
    const totals = PosService.getCartTotals(discount);
    return formatRupiah(totals.grandTotal);
  }

  get formattedChange(): string {
    const discount = parseFloat(this._discountInput) || 0;
    const totals = PosService.getCartTotals(discount);
    const paid = parseFloat(this._paidAmountInput) || 0;
    const change = Math.max(0, paid - totals.grandTotal);
    return formatRupiah(change);
  }

  refreshCart(): void {
    const items = PosService.getCart();
    const displayItems: CartDisplayItem[] = items.map(item => ({
      ...item,
      formattedUnitPrice: formatRupiah(item.unit_price),
      formattedSubtotal: formatRupiah(item.subtotal),
      photoPath: ImageCacheService.getImagePath(item.photo)
    }));

    this._cartItems.splice(0, this._cartItems.length, ...displayItems);
    this.notifyPropertyChange('cartItems', this._cartItems);

    // Default paid amount to grand total if empty
    const discount = parseFloat(this._discountInput) || 0;
    const totals = PosService.getCartTotals(discount);
    if (items.length === 0) {
      this.paidAmountInput = '0';
    } else if (!this._paidAmountInput || this._paidAmountInput === '0') {
      this.paidAmountInput = String(totals.grandTotal);
    }

    this.updateTotals();
  }

  updateTotals(): void {
    this.notifyPropertyChange('formattedSubtotal', this.formattedSubtotal);
    this.notifyPropertyChange('formattedGrandTotal', this.formattedGrandTotal);
    this.notifyPropertyChange('formattedChange', this.formattedChange);
    this.notifyPropertyChange('isEmptyCart', this.isEmptyCart);
    this.notifyPropertyChange('hasCartItems', this.hasCartItems);
    this.notifyPropertyChange('isCashPayment', this.isCashPayment);
  }

  incrementItem(index: number): void {
    const item = this._cartItems.getItem(index);
    if (!item) return;

    if (item.quantity >= item.stock) {
      showError(`Stok maksimal tercapai (${item.stock} item).`, 'Stok Maksimal');
      return;
    }

    try {
      PosService.updateQuantity(item.product_id, item.quantity + 1);
      this.refreshCart();
    } catch (err: any) {
      showError(err.message);
    }
  }

  decrementItem(index: number): void {
    const item = this._cartItems.getItem(index);
    if (!item) return;
    if (item.quantity <= 1) {
      PosService.removeFromCart(item.product_id);
    } else {
      PosService.updateQuantity(item.product_id, item.quantity - 1);
    }
    this.refreshCart();
  }

  removeItem(index: number): void {
    const item = this._cartItems.getItem(index);
    if (!item) return;
    PosService.removeFromCart(item.product_id);
    this.refreshCart();
  }

  async clearCart(): Promise<void> {
    const confirmed = await showConfirm('Kosongkan semua produk dalam keranjang?', 'Kosongkan Keranjang');
    if (confirmed) {
      PosService.clearCart();
      this.refreshCart();
    }
  }

  setPaidAmount(amount: number): void {
    this.paidAmountInput = String(amount);
  }

  async checkout(): Promise<void> {
    const cart = PosService.getCart();
    if (cart.length === 0) {
      showError('Keranjang belanja kosong.');
      return;
    }

    const discount = parseFloat(this._discountInput) || 0;
    const totals = PosService.getCartTotals(discount);

    let paidAmount = totals.grandTotal;
    if (this._paymentMethod === 'Cash') {
      paidAmount = parseFloat(this._paidAmountInput) || 0;
      if (paidAmount < totals.grandTotal) {
        showError(`Nominal uang yang diterima kurang. Minimal: ${formatRupiah(totals.grandTotal)}`, 'Pembayaran Kurang');
        return;
      }
    } else {
      paidAmount = totals.grandTotal;
    }

    const change = paidAmount - totals.grandTotal;

    const confirmed = await showConfirm(
      `Total Belanja: ${formatRupiah(totals.grandTotal)}\nMetode: ${this._paymentMethod}\nUang Diterima: ${formatRupiah(paidAmount)}\nKembalian: ${formatRupiah(change)}\n\nLanjutkan transaksi ini?`,
      'Konfirmasi Pembayaran'
    );

    if (!confirmed) return;

    this.isProcessing = true;
    try {
      const result = await PosService.checkout({
        items: cart.map(item => ({
          productId: item.product_id,
          product_id: item.product_id,
          productName: item.product_name,
          product_name: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          unit_price: item.unit_price,
          purchasePrice: item.purchase_price,
          purchase_price: item.purchase_price,
          subtotal: item.subtotal
        })),
        discount,
        paidAmount,
        paymentMethod: this._paymentMethod
      });

      await showSuccess(
        `Pembayaran Berhasil Diselesaikan!\n\nNo. Invoice: ${result.invoiceNumber}\nKembalian: ${formatRupiah(change)}`,
        'Transaksi Berhasil'
      );

      // Navigate to receipt page for printing and sharing
      if (result.saleId) {
        navigateTo('views/transactions/receipt-page', { saleId: result.saleId });
      } else {
        goBack();
      }
    } catch (err: any) {
      showError(err.message || 'Checkout gagal.');
    } finally {
      this.isProcessing = false;
    }
  }
}

let viewModel: CartViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new CartViewModel();
  page.bindingContext = viewModel;
}

export function onGoBack(): void { goBack(); }

export function onClearCart(): void {
  if (viewModel) viewModel.clearCart();
}

export function onIncrement(args: EventData): void {
  const item = (args.object as any).bindingContext;
  const index = viewModel.cartItems.indexOf(item);
  if (index >= 0) viewModel.incrementItem(index);
}

export function onDecrement(args: EventData): void {
  const item = (args.object as any).bindingContext;
  const index = viewModel.cartItems.indexOf(item);
  if (index >= 0) viewModel.decrementItem(index);
}

export function onQuantityInput(args: any): void {
  const textField = args.object;
  const item = textField.bindingContext as CartDisplayItem;
  if (!item || !viewModel) return;

  const textVal = textField.text;
  if (!textVal) return;
  const val = parseInt(textVal, 10);
  if (!isNaN(val) && val >= 0 && val !== item.quantity) {
    if (val > item.stock) {
      showError(`Stok hanya tersedia ${item.stock} item.`, 'Stok Tidak Cukup');
      textField.text = String(item.quantity);
      return;
    }
    try {
      PosService.updateQuantity(item.product_id, val);
      viewModel.refreshCart();
    } catch (e: any) {
      showError(e.message);
    }
  }
}

export function onRemoveItem(args: EventData): void {
  const item = (args.object as any).bindingContext;
  const index = viewModel.cartItems.indexOf(item);
  if (index >= 0) viewModel.removeItem(index);
}

export function onPayCash(): void { viewModel.paymentMethod = 'Cash'; }
export function onPayQRIS(): void { viewModel.paymentMethod = 'QRIS'; }
export function onPayTransfer(): void { viewModel.paymentMethod = 'Transfer'; }
export function onPayOther(): void { viewModel.paymentMethod = 'Other'; }

export function onPayExact(): void {
  const discount = parseFloat(viewModel.discountInput) || 0;
  const totals = PosService.getCartTotals(discount);
  viewModel.setPaidAmount(totals.grandTotal);
}

export function onPay50k(): void { viewModel.setPaidAmount(50000); }
export function onPay100k(): void { viewModel.setPaidAmount(100000); }
export function onPay200k(): void { viewModel.setPaidAmount(200000); }
export function onPay500k(): void { viewModel.setPaidAmount(500000); }

export function onCheckout(): void { viewModel.checkout(); }
