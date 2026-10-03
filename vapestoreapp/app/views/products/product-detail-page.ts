import { Observable, EventData, Page } from '@nativescript/core';
import { ProductService } from '../../services/product.service';
import { ApiService } from '../../services/api.service';
import { ImageCacheService } from '../../services/image-cache.service';
import { Product } from '../../models/product.model';
import { formatRupiah, getCategoryLabel } from '../../utils/formatters';
import { goBack, showError, showConfirm, showSuccess, navigateTo } from '../../utils/dialogs.helper';

export class ProductDetailViewModel extends Observable {
  private _product: Product | null = null;
  private _isLoading: boolean = false;
  private _photoUrl: string = '';
  private _categoryLabel: string = '';
  private _statusLabel: string = '';
  private _statusBadgeClass: string = '';
  private _formattedSellingPrice: string = '';
  private _formattedPurchasePrice: string = '';
  private _stockClass: string = '';
  private _hasSpecificInfo: boolean = false;
  private _specificInfo: string = '';

  get product(): Product | null { return this._product; }
  get isLoading(): boolean { return this._isLoading; }
  get photoUrl(): string { return this._photoUrl; }
  get categoryLabel(): string { return this._categoryLabel; }
  get statusLabel(): string { return this._statusLabel; }
  get statusBadgeClass(): string { return this._statusBadgeClass; }
  get formattedSellingPrice(): string { return this._formattedSellingPrice; }
  get formattedPurchasePrice(): string { return this._formattedPurchasePrice; }
  get stockClass(): string { return this._stockClass; }
  get hasSpecificInfo(): boolean { return this._hasSpecificInfo; }
  get specificInfo(): string { return this._specificInfo; }

  async loadProduct(id: number): Promise<void> {
    this._isLoading = true;
    this.notifyPropertyChange('isLoading', true);

    try {
      const product = await ProductService.getProductById(id);
      this._product = product;
      this._photoUrl = ImageCacheService.getImagePath(product.photo);
      this._categoryLabel = getCategoryLabel(product.category);
      this._statusLabel = product.status === 'active' ? 'Aktif' : 'Nonaktif';
      this._statusBadgeClass = product.status === 'active' ? 'badge badge-emerald' : 'badge badge-rose';
      this._formattedSellingPrice = formatRupiah(product.selling_price);
      this._formattedPurchasePrice = formatRupiah(product.purchase_price);
      this._stockClass = product.stock === 0 ? 'text-rose' : product.stock <= 5 ? 'text-amber' : 'text-primary';

      // Specific info
      const specs: string[] = [];
      if (product.category === 'liquid') {
        if (product.liquid_type) specs.push(`Tipe: ${product.liquid_type}`);
        if (product.nicotine_mg) specs.push(`Nikotin: ${product.nicotine_mg}mg`);
        if (product.volume_ml) specs.push(`Volume: ${product.volume_ml}ml`);
      }
      if (product.category === 'catridge' && product.resistance_ohm) {
        specs.push(`Resistance: ${product.resistance_ohm}Ω`);
      }
      this._hasSpecificInfo = specs.length > 0;
      this._specificInfo = specs.join('\n');

      // Notify all
      ['product', 'photoUrl', 'categoryLabel', 'statusLabel', 'statusBadgeClass',
        'formattedSellingPrice', 'formattedPurchasePrice', 'stockClass',
        'hasSpecificInfo', 'specificInfo'].forEach(p => this.notifyPropertyChange(p, (this as any)[p]));
    } catch (err: any) {
      showError(err.message || 'Gagal memuat detail produk.');
    } finally {
      this._isLoading = false;
      this.notifyPropertyChange('isLoading', false);
    }
  }

  async deleteProduct(): Promise<void> {
    if (!this._product) return;
    const confirmed = await showConfirm(`Hapus produk "${this._product.name}"?`, 'Konfirmasi Hapus');
    if (!confirmed) return;

    try {
      await ProductService.deleteProduct(this._product.id);
      await showSuccess('Produk berhasil dihapus.');
      goBack();
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus produk.');
    }
  }
}

let viewModel: ProductDetailViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  const context = page.navigationContext;
  viewModel = new ProductDetailViewModel();
  page.bindingContext = viewModel;

  if (context?.productId) {
    viewModel.loadProduct(context.productId);
  }
}

export function onGoBack(): void { goBack(); }

export function onEdit(): void {
  if (viewModel.product) {
    navigateTo('views/products/product-form-page', { product: viewModel.product });
  }
}

export function onDelete(): void {
  viewModel.deleteProduct();
}
