import { Observable, EventData, Page } from '@nativescript/core';
import { ProductService } from '../../services/product.service';
import { Product, ProductCategory } from '../../models/product.model';
import { goBack, showError, showSuccess } from '../../utils/dialogs.helper';

export class ProductFormViewModel extends Observable {
  private _isEdit: boolean = false;
  private _editId: number = 0;
  private _category: ProductCategory = 'device';
  private _name: string = '';
  private _purchasePrice: string = '0';
  private _sellingPrice: string = '0';
  private _stock: string = '0';
  private _unit: string = 'pcs';
  private _liquidType: string = '';
  private _nicotineMg: string = '';
  private _volumeMl: string = '';
  private _resistanceOhm: string = '';
  private _description: string = '';
  private _errorMessage: string = '';
  private _isSubmitting: boolean = false;

  constructor() {
    super();
    this.notifyCategoryChanges();
    this.notifyLiquidTypeChanges();
  }

  get isEdit(): boolean { return this._isEdit; }
  get category(): ProductCategory { return this._category; }
  set category(val: ProductCategory) {
    this._category = val;
    this.notifyCategoryChanges();
  }

  get isLiquid(): boolean { return this._category === 'liquid'; }
  get isCartridge(): boolean { return this._category === 'catridge'; }

  get catDeviceClass(): string {
    return this._category === 'device' ? 'chip-btn chip-btn-active-cyan' : 'chip-btn';
  }
  get catLiquidClass(): string {
    return this._category === 'liquid' ? 'chip-btn chip-btn-active-indigo' : 'chip-btn';
  }
  get catCoilClass(): string {
    return this._category === 'coil' ? 'chip-btn chip-btn-active-amber' : 'chip-btn';
  }
  get catCartridgeClass(): string {
    return this._category === 'catridge' ? 'chip-btn chip-btn-active-emerald' : 'chip-btn';
  }
  get catOtherClass(): string {
    return this._category === 'other' ? 'chip-btn chip-btn-active-slate' : 'chip-btn';
  }

  get liquidSaltnicClass(): string {
    return this._liquidType === 'Saltnic' ? 'chip-btn chip-btn-active-indigo' : 'chip-btn';
  }
  get liquidFreebaseClass(): string {
    return this._liquidType === 'Freebase' ? 'chip-btn chip-btn-active-amber' : 'chip-btn';
  }

  notifyCategoryChanges(): void {
    this.notifyPropertyChange('category', this._category);
    this.notifyPropertyChange('isLiquid', this.isLiquid);
    this.notifyPropertyChange('isCartridge', this.isCartridge);
    this.notifyPropertyChange('catDeviceClass', this.catDeviceClass);
    this.notifyPropertyChange('catLiquidClass', this.catLiquidClass);
    this.notifyPropertyChange('catCoilClass', this.catCoilClass);
    this.notifyPropertyChange('catCartridgeClass', this.catCartridgeClass);
    this.notifyPropertyChange('catOtherClass', this.catOtherClass);
  }

  notifyLiquidTypeChanges(): void {
    this.notifyPropertyChange('liquidType', this._liquidType);
    this.notifyPropertyChange('liquidSaltnicClass', this.liquidSaltnicClass);
    this.notifyPropertyChange('liquidFreebaseClass', this.liquidFreebaseClass);
  }

  get name(): string { return this._name; }
  set name(val: string) { this._name = val; this.notifyPropertyChange('name', val); }

  get purchasePrice(): string { return this._purchasePrice; }
  set purchasePrice(val: string) { this._purchasePrice = val; this.notifyPropertyChange('purchasePrice', val); }

  get sellingPrice(): string { return this._sellingPrice; }
  set sellingPrice(val: string) { this._sellingPrice = val; this.notifyPropertyChange('sellingPrice', val); }

  get stock(): string { return this._stock; }
  set stock(val: string) { this._stock = val; this.notifyPropertyChange('stock', val); }

  get unit(): string { return this._unit; }
  set unit(val: string) { this._unit = val; this.notifyPropertyChange('unit', val); }

  get liquidType(): string { return this._liquidType; }
  set liquidType(val: string) {
    this._liquidType = val;
    this.notifyLiquidTypeChanges();
  }

  get nicotineMg(): string { return this._nicotineMg; }
  set nicotineMg(val: string) { this._nicotineMg = val; this.notifyPropertyChange('nicotineMg', val); }

  get volumeMl(): string { return this._volumeMl; }
  set volumeMl(val: string) { this._volumeMl = val; this.notifyPropertyChange('volumeMl', val); }

  get resistanceOhm(): string { return this._resistanceOhm; }
  set resistanceOhm(val: string) { this._resistanceOhm = val; this.notifyPropertyChange('resistanceOhm', val); }

  get description(): string { return this._description; }
  set description(val: string) { this._description = val; this.notifyPropertyChange('description', val); }

  get errorMessage(): string { return this._errorMessage; }
  set errorMessage(val: string) { this._errorMessage = val; this.notifyPropertyChange('errorMessage', val); }

  get isSubmitting(): boolean { return this._isSubmitting; }
  set isSubmitting(val: boolean) { this._isSubmitting = val; this.notifyPropertyChange('isSubmitting', val); }

  loadExisting(product: Product): void {
    this._isEdit = true;
    this._editId = product.id;
    this.notifyPropertyChange('isEdit', true);
    this._category = product.category;
    this.name = product.name;
    this.purchasePrice = String(product.purchase_price);
    this.sellingPrice = String(product.selling_price);
    this.stock = String(product.stock);
    this.unit = product.unit;
    this.description = product.description || '';
    this._liquidType = product.liquid_type || '';
    if (product.nicotine_mg) this.nicotineMg = String(product.nicotine_mg);
    if (product.volume_ml) this.volumeMl = String(product.volume_ml);
    if (product.resistance_ohm) this.resistanceOhm = product.resistance_ohm;
    this.notifyCategoryChanges();
    this.notifyLiquidTypeChanges();
  }

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (!this._name.trim()) {
      this.errorMessage = 'Nama produk wajib diisi.';
      return;
    }

    if (this._category === 'liquid' && !this._liquidType) {
      this.errorMessage = 'Tipe liquid (Saltnic/Freebase) wajib dipilih.';
      return;
    }

    if (this._category === 'catridge' && !this._resistanceOhm.trim()) {
      this.errorMessage = 'Nilai resistance/ohm cartridge wajib diisi.';
      return;
    }

    this.isSubmitting = true;

    const data: any = {
      category: this._category,
      name: this._name.trim(),
      purchase_price: parseFloat(this._purchasePrice) || 0,
      selling_price: parseFloat(this._sellingPrice) || 0,
      stock: parseInt(this._stock) || 0,
      unit: this._unit.trim() || 'pcs',
      description: this._description.trim() || null,
      status: 'active'
    };

    if (this._category === 'liquid') {
      data.liquid_type = this._liquidType;
      data.nicotine_mg = parseInt(this._nicotineMg) || null;
      data.volume_ml = parseInt(this._volumeMl) || null;
    }
    if (this._category === 'catridge') {
      data.resistance_ohm = this._resistanceOhm.trim();
    }

    try {
      if (this._isEdit) {
        await ProductService.updateProduct(this._editId, data);
        await showSuccess('Produk berhasil diperbarui.');
      } else {
        await ProductService.createProduct(data);
        await showSuccess('Produk berhasil ditambahkan.');
      }
      goBack();
    } catch (err: any) {
      this.errorMessage = err.message || 'Gagal menyimpan produk.';
    } finally {
      this.isSubmitting = false;
    }
  }
}

let viewModel: ProductFormViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new ProductFormViewModel();

  const context = page.navigationContext;
  if (context?.product) {
    viewModel.loadExisting(context.product);
  }

  page.bindingContext = viewModel;
}

export function onGoBack(): void { goBack(); }

export function onCatDevice(): void { viewModel.category = 'device'; }
export function onCatLiquid(): void { viewModel.category = 'liquid'; }
export function onCatCoil(): void { viewModel.category = 'coil'; }
export function onCatCatridge(): void { viewModel.category = 'catridge'; }
export function onCatOther(): void { viewModel.category = 'other'; }

export function onLiquidSaltnic(): void { viewModel.liquidType = 'Saltnic'; }
export function onLiquidFreebase(): void { viewModel.liquidType = 'Freebase'; }

export function onSubmit(): void { viewModel.submit(); }
