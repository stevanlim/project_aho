import { Observable, EventData, Page } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';
import { navigateTo } from '../../utils/dialogs.helper';

export class PinViewModel extends Observable {
  private _pin: string = '';
  private _isLoading: boolean = false;
  private _errorMessage: string = '';

  get pin(): string { return this._pin; }
  set pin(val: string) {
    if (this._pin !== val) {
      this._pin = val;
      this.notifyPropertyChange('pin', val);
      this.notifyPropertyChange('pinLength', val.length);
    }
  }

  get pinLength(): number { return this._pin.length; }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    if (this._isLoading !== val) {
      this._isLoading = val;
      this.notifyPropertyChange('isLoading', val);
    }
  }

  get errorMessage(): string { return this._errorMessage; }
  set errorMessage(val: string) {
    if (this._errorMessage !== val) {
      this._errorMessage = val;
      this.notifyPropertyChange('errorMessage', val);
      this.notifyPropertyChange('hasError', this.hasError);
    }
  }

  get hasError(): boolean {
    return !!this._errorMessage && this._errorMessage.length > 0;
  }

  appendDigit(digit: string): void {
    if (this._pin.length < 6) {
      this.pin = this._pin + digit;

      // Auto-submit when 6 digits are entered
      if (this._pin.length === 6) {
        this.submitPin();
      }
    }
  }

  backspace(): void {
    if (this._pin.length > 0) {
      this.pin = this._pin.slice(0, -1);
    }
    this.errorMessage = '';
  }

  async submitPin(): Promise<void> {
    if (this._pin.length !== 6) {
      this.errorMessage = 'PIN harus 6 digit.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    try {
      const result = await AuthService.loginStep2(this._pin);

      if (result.success) {
        // Navigate to main app, clear nav history
        navigateTo('views/main/main-page', undefined, true);
      } else {
        this.errorMessage = result.error || 'PIN salah.';
        this.pin = '';
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Terjadi kesalahan.';
      this.pin = '';
    } finally {
      this.isLoading = false;
    }
  }

  backToLogin(): void {
    navigateTo('views/auth/login-page', undefined, true);
  }
}

let viewModel: PinViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;
  viewModel = new PinViewModel();
  page.bindingContext = viewModel;
}

export function onKeyPress(args: EventData): void {
  const btn = args.object as any;
  const digit = btn.text;
  viewModel.appendDigit(digit);
}

export function onBackspace(): void {
  viewModel.backspace();
}

export function onSubmitPin(): void {
  viewModel.submitPin();
}

export function onBackToLogin(): void {
  viewModel.backToLogin();
}
