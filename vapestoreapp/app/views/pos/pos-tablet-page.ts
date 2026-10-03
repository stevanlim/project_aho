import { Observable, EventData, Page, ObservableArray, ItemEventData } from '@nativescript/core';
import { ProductService } from '../../services/product.service';
import { PosService } from '../../services/pos.service';
import { ApiService } from '../../services/api.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { Product } from '../../models/product.model';
import { CartItem, PaymentMethod } from '../../models/sale.model';
import { formatRupiah, getCategoryLabel } from '../../utils/formatters';
import { showError, showSuccess, showConfirm } from '../../utils/dialogs.helper';

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  categoryLabel: string;
  stock: number;
  unit: string;
  selling_price: number;
  purchase_price: number;
  formattedPrice: string;
  photo: string | null;
  photoUrl: string;
}

interface CartDisplayItem extends CartItem {
  formattedUnitPrice: string;
  formattedSubtotal: string;
}

export class PosTabletViewModel extends Observable {
  private _products: ProductItem[] = [];
  private _filteredProducts: ObservableArray<ProductItem>;
  private _cartItems: ObservableArray<CartDisplayItem>;
  private _searchQuery: string = '';
  private _selectedCategory: string = 'all';
  private _isLoading: boolean = false;
  private _productCount: number = 0;

  // Checkout states
  private _paymentMethod: PaymentMethod = 'Cash';
  private _discountInput: string = '0';
  private _paidAmountInput: string = '';
  private _isProcessing: boolean = false;

  constructor() {
    super();
    this._filteredProducts = new ObservableArray<ProductItem>();
    this._cartItems = new ObservableArray<CartDisplayItem>();
    this.loadProducts();
    this.refreshCart();
  }

  // --- Getters / Setters ---
  get filteredProducts(): ObservableArray<ProductItem> { return this._filteredProducts; }
  get cartItems(): ObservableArray<CartDisplayItem> { return this._cartItems; }

  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    if (this._searchQuery !== val) {
      this._searchQuery = val;
      this.notifyPropertyChange('searchQuery', val);
      this.filterProducts();
    }
  }

  get selectedCategory(): string { return this._selectedCategory; }
  set selectedCategory(val: string) {
    if (this._selectedCategory !== val) {
      this._selectedCategory = val;
      this.notifyPropertyChange('selectedCategory', val);
      this.filterProducts();
    }
  }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    this._isLoading = val;
    this.notifyPropertyChange('isLoading', val);
  }

  get productCount(): number { return this._productCount; }
  set productCount(val: number) {
    this._productCount = val;
    this.notifyPropertyChange('productCount', val);
  }

  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  set paymentMethod(val: PaymentMethod) {
    this._paymentMethod = val;
    this.notifyPropertyChange('paymentMethod', val);
    this.updateTotals();
  }

  get discountInput(): string { return this._discountInput; }
  set discountInput(val: string) {
    this._discountInput = val;
    this.notifyPropertyChange('discountInput', val);
    this.updateTotals();
  }

  get paidAmountInput(): string { return this._paidAmountInput; }
  set paidAmountInput(val: string) {
    this._paidAmountInput = val;
    this.notifyPropertyChange('paidAmountInput', val);
    this.updateTotals();
  }

  get isProcessing(): boolean { return this._isProcessing; }
  set isProcessing(val: boolean) {
    this._isProcessing = val;
    this.notifyPropertyChange('isProcessing', val);
  }

  get cartCount(): number {
    let count = 0;
    for (let i = 0; i < this._cartItems.length; i++) {
      count += this._cartItems.getItem(i).quantity;
    }
    return count;
  }

  get isCartEmpty(): boolean {
    return this._cartItems.length === 0;
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

  // --- Methods ---
  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const products = await ProductService.getActiveProducts();
      this._products = products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        categoryLabel: getCategoryLabel(p.category),
        stock: p.stock,
        unit: p.unit,
        selling_price: p.selling_price,
        purchase_price: p.purchase_price,
        formattedPrice: formatRupiah(p.selling_price),
        photo: p.photo,
        photoUrl: ImageCacheService.getImagePath(p.photo)
      }));
      this.productCount = this._products.length;
      this.filterProducts();

      // Preload images
      ImageCacheService.preloadBatch(products.map(p => p.photo), () => {
        let updated = false;
        for (const item of this._products) {
          if (item.photo) {
            const cached = ImageCacheService.getImagePath(item.photo);
            if (cached !== item.photoUrl) {
              item.photoUrl = cached;
              updated = true;
            }
          }
        }
        if (updated) this.filterProducts();
      });
    } catch (err: any) {
      console.error('Load products error:', err);
      showError(err.message || 'Gagal memuat produk.');
    } finally {
      this.isLoading = false;
    }
  }

  filterProducts(): void {
    let results = this._products;

    if (this._selectedCategory !== 'all') {
      results = results.filter(p => p.category === this._selectedCategory);
    }

    if (this._searchQuery.trim()) {
      const query = this._searchQuery.toLowerCase().trim();
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
      );
    }

    results = results.filter(p => p.stock > 0);
    this._filteredProducts.splice(0, this._filteredProducts.length, ...results);
  }

  refreshCart(): void {
    const items = PosService.getCart();
    const displayItems = items.map(item => ({
      ...item,
      formattedUnitPrice: formatRupiah(item.unit_price),
      formattedSubtotal: formatRupiah(item.subtotal)
    }));
    this._cartItems.splice(0, this._cartItems.length, ...displayItems);
    this.updateTotals();
  }

  updateTotals(): void {
    this.notifyPropertyChange('cartCount', this.cartCount);
    this.notifyPropertyChange('isCartEmpty', this.isCartEmpty);
    this.notifyPropertyChange('formattedSubtotal', this.formattedSubtotal);
    this.notifyPropertyChange('formattedGrandTotal', this.formattedGrandTotal);
    this.notifyPropertyChange('formattedChange', this.formattedChange);
  }

  addProductToCart(product: ProductItem): void {
    try {
      PosService.addToCart({
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.selling_price,
        purchase_price: product.purchase_price,
        subtotal: product.selling_price,
        photo: product.photo,
        stock: product.stock
      });
      this.refreshCart();
    } catch (err: any) {
      showError(err.message);
    }
  }

  incrementItem(index: number): void {
    const item = this._cartItems.getItem(index);
    try {
      PosService.updateQuantity(item.product_id, item.quantity + 1);
      this.refreshCart();
    } catch (err: any) {
      showError(err.message);
    }
  }

  decrementItem(index: number): void {
    const item = this._cartItems.getItem(index);
    PosService.updateQuantity(item.product_id, item.quantity - 1);
    this.refreshCart();
  }

  removeItem(index: number): void {
    const item = this._cartItems.getItem(index);
    PosService.removeFromCart(item.product_id);
    this.refreshCart();
  }

  clearCart(): void {
    PosService.clearCart();
    this.refreshCart();
  }

  setPaidAmount(amount: number): void {
    this.paidAmountInput = String(amount);
  }

  async checkout(): Promise<void> {
    const cart = PosService.getCart();
    if (cart.length === 0) {
      showError('Keranjang belanja masih kosong.');
      return;
    }

    const discount = parseFloat(this._discountInput) || 0;
    const totals = PosService.getCartTotals(discount);

    let paidAmount = totals.grandTotal;
    if (this._paymentMethod === 'Cash') {
      paidAmount = parseFloat(this._paidAmountInput) || 0;
      if (paidAmount < totals.grandTotal) {
        showError(`Nominal bayar kurang. Minimal: ${formatRupiah(totals.grandTotal)}`);
        return;
      }
    }

    const confirmed = await showConfirm(
      `Total: ${formatRupiah(totals.grandTotal)}\nBayar: ${formatRupiah(paidAmount)}\nKembalian: ${formatRupiah(paidAmount - totals.grandTotal)}\n\nProses pembayaran sekarang?`,
      'Konfirmasi Checkout POS'
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

      await showSuccess(`Transaksi Sukses!\n\nNo. Invoice: ${result.invoiceNumber}\nKembalian: ${formatRupiah(paidAmount - totals.grandTotal)}`);

      // Reset cart and inputs
      this._discountInput = '0';
      this._paidAmountInput = '';
      this.refreshCart();
      this.loadProducts(); // Refresh stock
    } catch (err: any) {
      showError(err.message || 'Checkout gagal.');
    } finally {
      this.isProcessing = false;
    }
  }
}

let viewModel: PosTabletViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new PosTabletViewModel();
  page.bindingContext = viewModel;
}

export function onRefresh(): void {
  viewModel.loadProducts();
}

export function onProductTap(args: ItemEventData): void {
  const product = viewModel.filteredProducts.getItem(args.index);
  viewModel.addProductToCart(product);
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

export function onRemoveItem(args: EventData): void {
  const item = (args.object as any).bindingContext;
  const index = viewModel.cartItems.indexOf(item);
  if (index >= 0) viewModel.removeItem(index);
}

export function onClearCart(): void {
  viewModel.clearCart();
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

export function onCheckout(): void {
  viewModel.checkout();
}

// Category filter handlers
export function onFilterCategory(): void { viewModel.selectedCategory = 'all'; }
export function onFilterDevice(): void { viewModel.selectedCategory = 'device'; }
export function onFilterLiquid(): void { viewModel.selectedCategory = 'liquid'; }
export function onFilterCoil(): void { viewModel.selectedCategory = 'coil'; }
export function onFilterCartridge(): void { viewModel.selectedCategory = 'catridge'; }
export function onFilterOther(): void { viewModel.selectedCategory = 'other'; }
