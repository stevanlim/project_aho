import { Observable, EventData, Page } from '@nativescript/core';
import { ReportService } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { formatRupiah, formatYMD } from '../../utils/formatters';
import { showError, showConfirm, navigateTo } from '../../utils/dialogs.helper';

export class ReportViewModel extends Observable {
  private _isLoading: boolean = false;
  private _selectedPeriod: string = 'today'; // 'today' | 'month' | 'year' | 'custom'
  private _startDate: string = '';
  private _endDate: string = '';

  // Filtered Totals
  private _periodLabel: string = 'HARI INI';
  private _periodRevenue: string = 'Rp 0';
  private _periodSalesCount: string = '0';

  // Payment Breakdown
  private _cashRevenue: string = 'Rp 0';
  private _cashCount: string = '0 Transaksi';
  private _qrisRevenue: string = 'Rp 0';
  private _qrisCount: string = '0 Transaksi';
  private _transferRevenue: string = 'Rp 0';
  private _transferCount: string = '0 Transaksi';
  private _otherRevenue: string = 'Rp 0';
  private _otherCount: string = '0 Transaksi';

  // Admin Dashboard Overview Stats
  private _todayRevenue: string = 'Rp 0';
  private _todaySalesCount: string = '0';
  private _monthRevenue: string = 'Rp 0';
  private _monthSalesCount: string = '0';
  private _totalProducts: string = '0';
  private _lowStockCount: string = '0';
  private _outOfStockCount: string = '0';

  private _userRole: string = 'kasir';
  private _userName: string = '';

  constructor() {
    super();
    const user = AuthService.getCurrentUser();
    this._userRole = user?.role || 'kasir';
    this._userName = user?.name || user?.username || 'Kasir';

    const todayStr = formatYMD(new Date());
    this._startDate = todayStr;
    this._endDate = todayStr;

    this.loadData();
  }

  get isKasir(): boolean { return this._userRole === 'kasir'; }
  get isAdmin(): boolean { return this._userRole === 'admin'; }
  get userName(): string { return this._userName; }
  get pageTitle(): string { return this.isKasir ? 'Pendapatan Kasir' : 'Laporan Keuangan & Statistik'; }
  get pageSubtitle(): string {
    return this.isKasir
      ? 'Ringkasan total pendapatan dan metode pembayaran'
      : 'Analisis pendapatan, metode bayar, dan inventori';
  }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) { this._isLoading = val; this.notifyPropertyChange('isLoading', val); }

  get selectedPeriod(): string { return this._selectedPeriod; }
  get isCustomPeriod(): boolean { return this._selectedPeriod === 'custom'; }

  get startDate(): string { return this._startDate; }
  set startDate(val: string) { this._startDate = val; this.notifyPropertyChange('startDate', val); }

  get endDate(): string { return this._endDate; }
  set endDate(val: string) { this._endDate = val; this.notifyPropertyChange('endDate', val); }

  get periodLabel(): string { return this._periodLabel; }
  get periodRevenue(): string { return this._periodRevenue; }
  get periodSalesCount(): string { return this._periodSalesCount; }

  get cashRevenue(): string { return this._cashRevenue; }
  get cashCount(): string { return this._cashCount; }
  get qrisRevenue(): string { return this._qrisRevenue; }
  get qrisCount(): string { return this._qrisCount; }
  get transferRevenue(): string { return this._transferRevenue; }
  get transferCount(): string { return this._transferCount; }
  get otherRevenue(): string { return this._otherRevenue; }
  get otherCount(): string { return this._otherCount; }

  get todayRevenue(): string { return this._todayRevenue; }
  get todaySalesCount(): string { return this._todaySalesCount; }
  get monthRevenue(): string { return this._monthRevenue; }
  get monthSalesCount(): string { return this._monthSalesCount; }
  get totalProducts(): string { return this._totalProducts; }
  get lowStockCount(): string { return this._lowStockCount; }
  get outOfStockCount(): string { return this._outOfStockCount; }

  setPeriod(period: string): void {
    if (this._selectedPeriod === period) return;
    this._selectedPeriod = period;
    this.notifyPropertyChange('selectedPeriod', period);
    this.notifyPropertyChange('isCustomPeriod', this.isCustomPeriod);

    switch (period) {
      case 'today':
        this._periodLabel = 'HARI INI';
        break;
      case 'month':
        this._periodLabel = 'BULAN INI';
        break;
      case 'year':
        this._periodLabel = 'TAHUN INI';
        break;
      case 'custom':
        this._periodLabel = 'PERIODE KUSTOM';
        break;
    }
    this.notifyPropertyChange('periodLabel', this._periodLabel);

    if (period !== 'custom') {
      this.loadData();
    }
  }

  applyCustomFilter(): void {
    if (!this._startDate || !this._endDate) {
      showError('Tanggal mulai dan selesai wajib diisi.', 'Filter Tanggal');
      return;
    }
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      // 1. Fetch Financial Report with Payment Breakdown for Selected Period
      const params: any = { period: this._selectedPeriod };
      if (this._selectedPeriod === 'custom') {
        params.startDate = this._startDate;
        params.endDate = this._endDate;
      }

      const report = await ReportService.getFinancialReport(params);
      if (report) {
        this._periodRevenue = formatRupiah(report.totalRevenue || 0);
        this._periodSalesCount = String(report.totalTransactions || 0);

        const pb = report.paymentBreakdown || {};
        this._cashRevenue = formatRupiah(pb.cash?.total || 0);
        this._cashCount = `${pb.cash?.count || 0} Trx`;

        this._qrisRevenue = formatRupiah(pb.qris?.total || 0);
        this._qrisCount = `${pb.qris?.count || 0} Trx`;

        this._transferRevenue = formatRupiah(pb.transfer?.total || 0);
        this._transferCount = `${pb.transfer?.count || 0} Trx`;

        this._otherRevenue = formatRupiah(pb.other?.total || 0);
        this._otherCount = `${pb.other?.count || 0} Trx`;
      }

      // 2. Fetch Dashboard Overview Stats (Today, Month, Inventory)
      try {
        const stats = await ReportService.getDashboardStats();
        if (stats) {
          this._todaySalesCount = String(stats.todaySalesCount || 0);
          this._todayRevenue = formatRupiah(stats.todayRevenue || 0);
          this._monthSalesCount = String(stats.monthSalesCount || 0);
          this._monthRevenue = formatRupiah(stats.monthRevenue || 0);
          this._totalProducts = String(stats.totalProducts || 0);
          this._lowStockCount = String(stats.lowStockCount || 0);
          this._outOfStockCount = String(stats.outOfStockCount || 0);
        }
      } catch (e) {
        console.warn('Dashboard stats fallback:', e);
      }

      // Notify all properties
      [
        'periodLabel', 'periodRevenue', 'periodSalesCount',
        'cashRevenue', 'cashCount', 'qrisRevenue', 'qrisCount',
        'transferRevenue', 'transferCount', 'otherRevenue', 'otherCount',
        'todayRevenue', 'todaySalesCount', 'monthRevenue', 'monthSalesCount',
        'totalProducts', 'lowStockCount', 'outOfStockCount',
        'isKasir', 'isAdmin', 'pageTitle', 'pageSubtitle', 'isCustomPeriod'
      ].forEach(p => this.notifyPropertyChange(p, (this as any)[p]));

    } catch (err: any) {
      showError(err.message || 'Gagal memuat data laporan.');
    } finally {
      this.isLoading = false;
    }
  }

  async logout(): Promise<void> {
    const confirmed = await showConfirm('Yakin ingin keluar dari akun kasir?', 'Logout Kasir');
    if (!confirmed) return;

    await AuthService.logout();
    navigateTo('views/auth/login-page', undefined, true);
  }
}

let viewModel: ReportViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new ReportViewModel();
  page.bindingContext = viewModel;
}

export function onFilterToday(): void { viewModel.setPeriod('today'); }
export function onFilterMonth(): void { viewModel.setPeriod('month'); }
export function onFilterYear(): void { viewModel.setPeriod('year'); }
export function onFilterCustom(): void { viewModel.setPeriod('custom'); }
export function onApplyCustomFilter(): void { viewModel.applyCustomFilter(); }

export function onRefresh(): void {
  viewModel.loadData();
}

export function onLogout(): void {
  viewModel.logout();
}
