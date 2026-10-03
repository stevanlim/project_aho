import { Observable, EventData, Page, ObservableArray } from '@nativescript/core';
import { ProductService } from '../../services/product.service';
import { StockService } from '../../services/stock.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { Product } from '../../models/product.model';
import { formatRupiah } from '../../utils/formatters';
import { goBack, showError, showSuccess } from '../../utils/dialogs.helper';

export class StockInViewModel extends Observable {
  private _products: Product[] = [];
  private _filteredProducts: ObservableArray<any>;
  private _searchQuery: string = '';
  private _showSearchResults: boolean = false;
  private _selectedProduct: Product | null = null;
  private _quantity: string = '';
  private _purchasePrice: string = '';
  private _note: string = '';
  private _errorMessage: string = '';
  private _successMessage: string = '';
  private _isSubmitting: boolean = false;
  private _isLoadingProducts: boolean = false;

  constructor() {
    super();
    this._filteredProducts = new ObservableArray<any>();
    this.loadProducts();
  }

  get filteredProducts(): ObservableArray<any> { return this._filteredProducts; }

  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    this._searchQuery = val;
    this.notifyPropertyChange('searchQuery', val);
  }

  get showSearchResults(): boolean { return this._showSearchResults; }
  set showSearchResults(val: boolean) {
    this._showSearchResults = val;
    this.notifyPropertyChange('showSearchResults', val);
  }

  get searchResultsCountText(): string {
    return `Hasil Pencarian (${this._filteredProducts.length} produk):`;
  }

  get selectedProduct(): Product | null { return this._selectedProduct; }
  get hasSelectedProduct(): boolean { return this._selectedProduct !== null; }
  get selectedProductName(): string { return this._selectedProduct ? this._selectedProduct.name : ''; }
  get selectedProductSku(): string { return this._selectedProduct ? (this._selectedProduct.sku || '-') : ''; }
  get selectedProductStock(): string { return this._selectedProduct ? `${this._selectedProduct.stock} ${this._selectedProduct.unit || 'pcs'}` : '0'; }
  get selectedProductCurrentPrice(): string { return this._selectedProduct ? formatRupiah(this._selectedProduct.purchase_price) : 'Rp 0'; }
  get selectedProductPhotoUrl(): string {
    return this._selectedProduct ? ImageCacheService.getImagePath(this._selectedProduct.photo) : '~/assets/logo.png';
  }

  get quantity(): string { return this._quantity; }
  set quantity(val: string) { this._quantity = val; this.notifyPropertyChange('quantity', val); }

  get purchasePrice(): string { return this._purchasePrice; }
  set purchasePrice(val: string) { this._purchasePrice = val; this.notifyPropertyChange('purchasePrice', val); }

  get note(): string { return this._note; }
  set note(val: string) { this._note = val; this.notifyPropertyChange('note', val); }

  get errorMessage(): string { return this._errorMessage; }
  set errorMessage(val: string) { this._errorMessage = val; this.notifyPropertyChange('errorMessage', val); }

  get successMessage(): string { return this._successMessage; }
  set successMessage(val: string) { this._successMessage = val; this.notifyPropertyChange('successMessage', val); }

  get isSubmitting(): boolean { return this._isSubmitting; }
  set isSubmitting(val: boolean) { this._isSubmitting = val; this.notifyPropertyChange('isSubmitting', val); }

  get isLoadingProducts(): boolean { return this._isLoadingProducts; }
  set isLoadingProducts(val: boolean) { this._isLoadingProducts = val; this.notifyPropertyChange('isLoadingProducts', val); }

  async loadProducts(): Promise<void> {
    this.isLoadingProducts = true;
    try {
      let products: Product[] = [];
      try {
        const res = await ProductService.getProducts({ limit: 500 });
        if (res && Array.isArray(res.products) && res.products.length > 0) {
          products = res.products;
        }
      } catch (e) {
        console.warn('ProductService.getProducts fallback:', e);
      }

      if (products.length === 0) {
        products = await ProductService.getActiveProducts();
      }

      this._products = products;
      // Do NOT show search results automatically on initial load
      this.showSearchResults = false;
    } catch (err: any) {
      console.error('loadProducts error:', err);
      this.errorMessage = 'Gagal memuat katalog produk. Periksa koneksi ke server.';
    } finally {
      this.isLoadingProducts = false;
    }
  }

  performSearch(): void {
    const q = this._searchQuery.toLowerCase().trim();
    const matched = q
      ? this._products.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))).slice(0, 25)
      : this._products.slice(0, 15);

    const items = matched.map(p => ({
      ...p,
      photoUrl: ImageCacheService.getImagePath(p.photo),
      stockText: `${p.sku || '-'} • Stok saat ini: ${p.stock} ${p.unit || 'pcs'}`
    }));

    this._filteredProducts.splice(0, this._filteredProducts.length, ...items);
    this.showSearchResults = true;
    this.notifyPropertyChange('filteredProducts', this._filteredProducts);
    this.notifyPropertyChange('searchResultsCountText', this.searchResultsCountText);

    // Preload batch images in background
    ImageCacheService.preloadBatch(matched.map(p => p.photo), () => {
      let updated = false;
      for (let i = 0; i < this._filteredProducts.length; i++) {
        const item = this._filteredProducts.getItem(i);
        if (item && item.photo) {
          const cached = ImageCacheService.getImagePath(item.photo);
          if (cached !== item.photoUrl) {
            item.photoUrl = cached;
            updated = true;
          }
        }
      }
      if (updated) {
        this.notifyPropertyChange('filteredProducts', this._filteredProducts);
      }
    });
  }

  closeSearchResults(): void {
    this.showSearchResults = false;
  }

  selectProduct(product: Product): void {
    this._selectedProduct = product;
    this.showSearchResults = false;
    this.notifyPropertyChange('selectedProduct', product);
    this.notifyPropertyChange('hasSelectedProduct', true);
    this.notifyPropertyChange('selectedProductName', this.selectedProductName);
    this.notifyPropertyChange('selectedProductSku', this.selectedProductSku);
    this.notifyPropertyChange('selectedProductStock', this.selectedProductStock);
    this.notifyPropertyChange('selectedProductCurrentPrice', this.selectedProductCurrentPrice);
    this.notifyPropertyChange('selectedProductPhotoUrl', this.selectedProductPhotoUrl);

    this.purchasePrice = String(product.purchase_price || 0);
    this.errorMessage = '';
  }

  changeProduct(): void {
    this._selectedProduct = null;
    this.notifyPropertyChange('selectedProduct', null);
    this.notifyPropertyChange('hasSelectedProduct', false);
    if (this._searchQuery.trim()) {
      this.performSearch();
    }
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this._selectedProduct) {
      showError('Silakan cari dan pilih salah satu produk terlebih dahulu.', 'Pilih Produk');
      this.errorMessage = 'Pilih produk terlebih dahulu.';
      return;
    }

    const qty = parseInt(this._quantity);
    if (!qty || isNaN(qty) || qty === 0) {
      showError('Masukkan jumlah stok yang valid (tidak boleh 0).', 'Jumlah Tidak Valid');
      this.errorMessage = 'Jumlah stok tidak boleh kosong atau 0.';
      return;
    }

    this.isSubmitting = true;
    try {
      await StockService.addStockIn({
        productId: this._selectedProduct.id,
        quantity: qty,
        purchasePrice: parseFloat(this._purchasePrice) || 0,
        note: this._note || undefined
      });

      const msg = `Stok ${qty > 0 ? '+' + qty : qty} ${this._selectedProduct.unit || 'item'} berhasil dicatat untuk "${this._selectedProduct.name}".`;
      await showSuccess(msg, 'Stok Masuk Berhasil');
      goBack();
    } catch (err: any) {
      console.error('Submit stock in error:', err);
      const errMsg = err.message || 'Gagal menyimpan stok masuk ke server.';
      showError(errMsg, 'Gagal Menyimpan');
      this.errorMessage = errMsg;
    } finally {
      this.isSubmitting = false;
    }
  }
}

let viewModel: StockInViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new StockInViewModel();
  page.bindingContext = viewModel;
}

export function onGoBack(): void { goBack(); }

export function onSearch(): void {
  if (viewModel) {
    viewModel.performSearch();
  }
}

export function onCloseSearchResults(): void {
  if (viewModel) {
    viewModel.closeSearchResults();
  }
}

export function onSelectProductItem(args: EventData): void {
  const view = args.object as any;
  const product = view.bindingContext as Product;
  if (product && viewModel) {
    viewModel.selectProduct(product);
  }
}

export function onChangeProduct(): void {
  if (viewModel) {
    viewModel.changeProduct();
  }
}

export function onSubmit(): void {
  if (viewModel) {
    viewModel.submit();
  }
}
