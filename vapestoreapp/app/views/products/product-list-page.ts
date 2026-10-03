import { Observable, EventData, Page, ObservableArray, ItemEventData } from '@nativescript/core';
import { ProductService } from '../../services/product.service';
import { ApiService } from '../../services/api.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { Product } from '../../models/product.model';
import { formatRupiah, getCategoryLabel } from '../../utils/formatters';
import { navigateTo, showError } from '../../utils/dialogs.helper';

interface ProductDisplayItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  categoryLabel: string;
  stock: number;
  unit: string;
  status: string;
  statusLabel: string;
  statusBadgeClass: string;
  formattedPrice: string;
  stockClass: string;
  photo: string | null;
  photoUrl: string;
}

export class ProductListViewModel extends Observable {
  private _products: ObservableArray<ProductDisplayItem>;
  private _allProducts: ProductDisplayItem[] = [];
  private _searchQuery: string = '';
  private _categoryFilter: string = 'all';
  private _isLoading: boolean = false;
  private _totalProducts: number = 0;

  constructor() {
    super();
    this._products = new ObservableArray<ProductDisplayItem>();
    this.loadProducts();
  }

  get products(): ObservableArray<ProductDisplayItem> { return this._products; }

  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(val: string) {
    this._searchQuery = val;
    this.notifyPropertyChange('searchQuery', val);
    this.applyFilters();
  }

  get categoryFilter(): string { return this._categoryFilter; }
  set categoryFilter(val: string) {
    this._categoryFilter = val;
    this.notifyPropertyChange('categoryFilter', val);
    this.notifyFilterClasses();
    this.applyFilters();
  }

  get filterAllClass(): string { return this._categoryFilter === 'all' ? 'pill active' : 'pill'; }
  get filterDeviceClass(): string { return this._categoryFilter === 'device' ? 'pill active' : 'pill'; }
  get filterLiquidClass(): string { return this._categoryFilter === 'liquid' ? 'pill active' : 'pill'; }
  get filterCoilClass(): string { return this._categoryFilter === 'coil' ? 'pill active' : 'pill'; }
  get filterCartridgeClass(): string { return this._categoryFilter === 'catridge' ? 'pill active' : 'pill'; }
  get filterOtherClass(): string { return this._categoryFilter === 'other' ? 'pill active' : 'pill'; }

  notifyFilterClasses(): void {
    this.notifyPropertyChange('filterAllClass', this.filterAllClass);
    this.notifyPropertyChange('filterDeviceClass', this.filterDeviceClass);
    this.notifyPropertyChange('filterLiquidClass', this.filterLiquidClass);
    this.notifyPropertyChange('filterCoilClass', this.filterCoilClass);
    this.notifyPropertyChange('filterCartridgeClass', this.filterCartridgeClass);
    this.notifyPropertyChange('filterOtherClass', this.filterOtherClass);
  }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    this._isLoading = val;
    this.notifyPropertyChange('isLoading', val);
  }

  get totalProducts(): number { return this._totalProducts; }
  set totalProducts(val: number) {
    this._totalProducts = val;
    this.notifyPropertyChange('totalProducts', val);
  }

  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const result = await ProductService.getProducts({ limit: 1000 });
      const products = result.products || [];
      this._allProducts = products.map(p => this.mapProduct(p));
      this.totalProducts = this._allProducts.length;
      this.applyFilters();

      // Preload images
      ImageCacheService.preloadBatch(products.map(p => p.photo), () => {
        let updated = false;
        for (const item of this._allProducts) {
          if (item.photo) {
            const cached = ImageCacheService.getImagePath(item.photo);
            if (cached !== item.photoUrl) {
              item.photoUrl = cached;
              updated = true;
            }
          }
        }
        if (updated) this.applyFilters();
      });
    } catch (err: any) {
      showError(err.message || 'Gagal memuat produk.');
    } finally {
      this.isLoading = false;
    }
  }

  private mapProduct(p: Product): ProductDisplayItem {
    const isLowStock = p.stock > 0 && p.stock <= 5;
    const isOutOfStock = p.stock === 0;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      categoryLabel: getCategoryLabel(p.category),
      stock: p.stock,
      unit: p.unit,
      status: p.status,
      statusLabel: p.status === 'active' ? 'Aktif' : 'Nonaktif',
      statusBadgeClass: p.status === 'active' ? 'badge badge-emerald' : 'badge badge-rose',
      formattedPrice: formatRupiah(p.selling_price),
      stockClass: isOutOfStock ? 'text-xs text-rose font-bold' : isLowStock ? 'text-xs text-amber font-bold' : 'text-xs text-secondary',
      photo: p.photo,
      photoUrl: ImageCacheService.getImagePath(p.photo)
    };
  }

  applyFilters(): void {
    let filtered = this._allProducts;
    if (this._categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === this._categoryFilter);
    }
    if (this._searchQuery.trim()) {
      const q = this._searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    this._products.splice(0, this._products.length, ...filtered);
  }
}

let viewModel: ProductListViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new ProductListViewModel();
  page.bindingContext = viewModel;
}

export function onProductTap(args: ItemEventData): void {
  const product = viewModel.products.getItem(args.index);
  navigateTo('views/products/product-detail-page', { productId: product.id });
}

export function onAddProduct(): void {
  navigateTo('views/products/product-form-page');
}

export function onFilterAll(): void { viewModel.categoryFilter = 'all'; }
export function onFilterDevice(): void { viewModel.categoryFilter = 'device'; }
export function onFilterLiquid(): void { viewModel.categoryFilter = 'liquid'; }
export function onFilterCoil(): void { viewModel.categoryFilter = 'coil'; }
export function onFilterCatridge(): void { viewModel.categoryFilter = 'catridge'; }
export function onFilterOther(): void { viewModel.categoryFilter = 'other'; }
