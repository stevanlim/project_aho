import { Observable, EventData, Page, ObservableArray } from '@nativescript/core';
import { ProductService } from '../../services/product.service';
import { PosService } from '../../services/pos.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { Product } from '../../models/product.model';
import { formatRupiah, getCategoryLabel } from '../../utils/formatters';
import { navigateTo, showError, showSuccess } from '../../utils/dialogs.helper';

export interface ProductItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  categoryLabel: string;
  categoryBadgeClass: string;
  stock: number;
  unit: string;
  selling_price: number;
  purchase_price: number;
  formattedPrice: string;
  photo: string | null;
  photoPath: string;
  variantText: string;
  stockBadgeText: string;
  stockBadgeClass: string;
  stockText: string;
  stockClass: string;
  stockColor: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
  cartQty: number;
  inCartText: string;
  hasInCart: boolean;
}

export interface ProductPair {
  left: ProductItem;
  right: ProductItem | null;
}

export class PosViewModel extends Observable {
  private _products: ProductItem[] = [];
  private _productPairs: ObservableArray<ProductPair>;
  private _searchQuery: string = '';
  private _selectedFilter: string = 'all';
  private _isLoading: boolean = false;
  private _cartItemCount: number = 0;
  private _cartTotal: string = 'Rp 0';
  private _productCountText: string = '0 produk tersedia';
  private _allFilterText: string = 'Semua';
  private _cartBadgeText: string = 'KERANJANG (0)';
  private _cartBarSummary: string = '0 Item • Rp 0';
  private _isCartVisible: boolean = false;

  constructor() {
    super();
    this._productPairs = new ObservableArray<ProductPair>();
    this.loadProducts();
    this.updateCartDisplay();
  }

  get productPairs(): ObservableArray<ProductPair> { return this._productPairs; }
  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    if (this._searchQuery !== val) {
      this._searchQuery = val;
      this.notifyPropertyChange('searchQuery', val);
      this.filterProducts();
    }
  }

  get selectedFilter(): string { return this._selectedFilter; }
  set selectedFilter(val: string) {
    if (this._selectedFilter !== val) {
      this._selectedFilter = val;
      this.notifyPropertyChange('selectedFilter', val);
      this.filterProducts();
    }
  }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    if (this._isLoading !== val) {
      this._isLoading = val;
      this.notifyPropertyChange('isLoading', val);
    }
  }

  get productCountText(): string { return this._productCountText; }
  set productCountText(val: string) {
    this._productCountText = val;
    this.notifyPropertyChange('productCountText', val);
  }

  get allFilterText(): string { return this._allFilterText; }
  set allFilterText(val: string) {
    this._allFilterText = val;
    this.notifyPropertyChange('allFilterText', val);
  }

  get cartBadgeText(): string { return this._cartBadgeText; }
  set cartBadgeText(val: string) {
    this._cartBadgeText = val;
    this.notifyPropertyChange('cartBadgeText', val);
  }

  get cartItemCount(): number { return this._cartItemCount; }
  get hasCartItems(): boolean { return this._cartItemCount > 0; }

  get cartBarSummary(): string { return this._cartBarSummary; }
  set cartBarSummary(val: string) {
    this._cartBarSummary = val;
    this.notifyPropertyChange('cartBarSummary', val);
  }

  get isCartVisible(): boolean { return this._isCartVisible; }
  set isCartVisible(val: boolean) {
    this._isCartVisible = val;
    this.notifyPropertyChange('isCartVisible', val);
  }

  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const rawProducts = await ProductService.getActiveProducts();
      const cart = PosService.getCart();

      this._products = rawProducts.map(p => {
        const inCart = cart.find(c => c.product_id === p.id);
        const cartQty = inCart ? inCart.quantity : 0;
        const isLow = p.stock > 0 && p.stock <= 5;
        const isOut = p.stock <= 0;

        // Build variant/specs subtitle
        let variant = '';
        if (p.category === 'liquid') {
          const parts = [
            p.liquid_type,
            p.nicotine_mg ? `${p.nicotine_mg}mg` : null,
            p.volume_ml ? `${p.volume_ml}ml` : null
          ].filter(Boolean);
          variant = parts.join(' • ');
        } else if (p.category === 'coil' || p.category === 'catridge') {
          variant = p.resistance_ohm || p.sku;
        } else if (p.category === 'device') {
          variant = 'Kit / Mod / Pod';
        } else {
          variant = p.sku;
        }

        // Category Badge styling
        let catBadgeClass = 'badge badge-slate';
        if (p.category === 'liquid') catBadgeClass = 'badge badge-cyan';
        else if (p.category === 'device') catBadgeClass = 'badge badge-emerald';
        else if (p.category === 'coil') catBadgeClass = 'badge badge-amber';
        else if (p.category === 'catridge') catBadgeClass = 'badge badge-indigo';

        // Stock Badge styling
        let stockBadgeText = '';
        let stockBadgeClass = '';
        if (isOut) {
          stockBadgeText = 'HABIS';
          stockBadgeClass = 'badge badge-rose';
        } else if (isLow) {
          stockBadgeText = `SISA ${p.stock}`;
          stockBadgeClass = 'badge badge-amber';
        }

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          categoryLabel: getCategoryLabel(p.category),
          categoryBadgeClass: catBadgeClass,
          stock: p.stock,
          unit: p.unit || 'pcs',
          selling_price: p.selling_price,
          purchase_price: p.purchase_price,
          formattedPrice: formatRupiah(p.selling_price),
          photo: p.photo,
          photoPath: ImageCacheService.getImagePath(p.photo),
          variantText: variant || p.sku,
          stockBadgeText,
          stockBadgeClass,
          stockText: isOut ? 'Habis' : isLow ? `Menipis (${p.stock})` : `Stok: ${p.stock}`,
          stockClass: isOut ? 'stock-out text-right' : isLow ? 'stock-low text-right' : 'stock-normal text-right',
          stockColor: isOut ? '#f43f5e' : isLow ? '#f59e0b' : '#94a3b8',
          isLowStock: isLow,
          isOutOfStock: isOut,
          cartQty,
          inCartText: `${cartQty}x`,
          hasInCart: cartQty > 0
        };
      });

      this.allFilterText = `Semua (${this._products.length})`;
      this.productCountText = `${this._products.length} produk tersedia`;
      this.filterProducts();

      // Background preload images in batches
      ImageCacheService.preloadBatch(
        rawProducts.map(p => p.photo),
        () => {
          // Update photo paths for loaded items
          let hasUpdated = false;
          for (const item of this._products) {
            if (item.photo) {
              const cached = ImageCacheService.getImagePath(item.photo);
              if (cached !== item.photoPath) {
                item.photoPath = cached;
                hasUpdated = true;
              }
            }
          }
          if (hasUpdated) {
            this.filterProducts();
          }
        }
      );
    } catch (err: any) {
      console.error('Load products error:', err);
      showError(err.message || 'Gagal memuat produk.');
    } finally {
      this.isLoading = false;
    }
  }

  filterProducts(): void {
    let results = [...this._products];

    // Filter by category or stock
    if (this._selectedFilter === 'low') {
      results = results.filter(p => p.isLowStock);
    } else if (this._selectedFilter === 'out') {
      results = results.filter(p => p.isOutOfStock);
    } else if (this._selectedFilter !== 'all') {
      results = results.filter(p => p.category === this._selectedFilter);
    }

    // Filter by search query
    if (this._searchQuery.trim()) {
      const q = this._searchQuery.toLowerCase().trim();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.variantText.toLowerCase().includes(q)
      );
    }

    this.productCountText = `${results.length} produk ditampilkan`;

    // Group into 2-column pairs
    const pairs: ProductPair[] = [];
    for (let i = 0; i < results.length; i += 2) {
      pairs.push({
        left: results[i],
        right: results[i + 1] || null
      });
    }

    this._productPairs.splice(0, this._productPairs.length, ...pairs);
  }

  updateCartDisplay(): void {
    const totals = PosService.getCartTotals();
    const cart = PosService.getCart();
    this._cartItemCount = totals.itemCount;
    this._cartTotal = formatRupiah(totals.grandTotal);

    this.cartBadgeText = totals.itemCount > 0 ? `KERANJANG (${totals.itemCount})` : 'KERANJANG (0)';
    this.cartBarSummary = `${totals.itemCount} Item • ${formatRupiah(totals.grandTotal)}`;
    this.isCartVisible = totals.itemCount > 0;
    this.notifyPropertyChange('cartItemCount', this._cartItemCount);
    this.notifyPropertyChange('hasCartItems', this.hasCartItems);

    // Update in-cart state for all items
    for (const item of this._products) {
      const match = cart.find(c => c.product_id === item.id);
      const qty = match ? match.quantity : 0;
      item.cartQty = qty;
      item.inCartText = `+${qty}`;
      item.hasInCart = qty > 0;
    }

    // Refresh pairs display
    for (let i = 0; i < this._productPairs.length; i++) {
      const pair = this._productPairs.getItem(i);
      this._productPairs.setItem(i, { ...pair });
    }
  }

  addProductToCart(product: ProductItem): void {
    if (product.stock <= 0) {
      showError(`Stok produk "${product.name}" sedang habis.`, 'Stok Habis');
      return;
    }

    const currentInCart = product.cartQty;
    if (currentInCart >= product.stock) {
      showError(
        `Maksimal stok tercapai untuk "${product.name}".\nTersedia: ${product.stock} item.\n\nSilakan buka keranjang untuk melanjutkan pembayaran.`,
        'Stok Maksimal'
      );
      return;
    }

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
      this.updateCartDisplay();
    } catch (err: any) {
      showError(err.message);
    }
  }
}

let viewModel: PosViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  if (!viewModel) {
    viewModel = new PosViewModel();
  } else {
    viewModel.updateCartDisplay();
  }
  page.bindingContext = viewModel;
}

export function onRefresh(): void {
  if (viewModel) viewModel.loadProducts();
}

export function onTapLeft(args: EventData): void {
  const layout = args.object as any;
  const pair = layout.bindingContext as ProductPair;
  if (pair && pair.left && viewModel) {
    viewModel.addProductToCart(pair.left);
  }
}

export function onTapRight(args: EventData): void {
  const layout = args.object as any;
  const pair = layout.bindingContext as ProductPair;
  if (pair && pair.right && viewModel) {
    viewModel.addProductToCart(pair.right);
  }
}

export function onOpenCart(): void {
  navigateTo('views/pos/cart-page');
}

// Filter button handlers
export function onFilterAll(): void { if (viewModel) viewModel.selectedFilter = 'all'; }
export function onFilterLow(): void { if (viewModel) viewModel.selectedFilter = 'low'; }
export function onFilterOut(): void { if (viewModel) viewModel.selectedFilter = 'out'; }
export function onFilterDevice(): void { if (viewModel) viewModel.selectedFilter = 'device'; }
export function onFilterLiquid(): void { if (viewModel) viewModel.selectedFilter = 'liquid'; }
export function onFilterCoil(): void { if (viewModel) viewModel.selectedFilter = 'coil'; }
export function onFilterCartridge(): void { if (viewModel) viewModel.selectedFilter = 'catridge'; }
export function onFilterOther(): void { if (viewModel) viewModel.selectedFilter = 'other'; }
