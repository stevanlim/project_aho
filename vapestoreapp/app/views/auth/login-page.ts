import { Observable, EventData, Page, TextField } from '@nativescript/core';
import { AuthService } from '../../services/auth.service';
import { navigateTo } from '../../utils/dialogs.helper';

export class LoginViewModel extends Observable {
  private _username: string = 'admin_vape';
  private _password: string = '';
  private _isLoading: boolean = false;
  private _errorMessage: string = '';
  private _isPasswordVisible: boolean = false;

  get username(): string { return this._username; }
  set username(val: string) {
    if (this._username !== val) {
      this._username = val;
      this.notifyPropertyChange('username', val);
    }
  }

  get password(): string { return this._password; }
  set password(val: string) {
    if (this._password !== val) {
      this._password = val;
      this.notifyPropertyChange('password', val);
    }
  }

  get isLoading(): boolean { return this._isLoading; }
  set isLoading(val: boolean) {
    if (this._isLoading !== val) {
      this._isLoading = val;
      this.notifyPropertyChange('isLoading', val);
      this.notifyPropertyChange('buttonText', this.buttonText);
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

  get isPasswordVisible(): boolean {
    return this._isPasswordVisible;
  }
  set isPasswordVisible(val: boolean) {
    if (this._isPasswordVisible !== val) {
      this._isPasswordVisible = val;
      this.notifyPropertyChange('isPasswordVisible', val);
    }
  }

  togglePassword(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  get buttonText(): string {
    return this._isLoading ? 'Memproses...' : 'Masuk';
  }

  async onLogin(): Promise<void> {
    this.errorMessage = '';

    const cleanUsername = this._username.trim();
    const cleanPassword = this._password;

    console.log(`[LOGIN ATTEMPT] Username: "${cleanUsername}", Password length: ${cleanPassword.length}`);

    if (!cleanUsername) {
      this.errorMessage = 'Username wajib diisi.';
      return;
    }
    if (!cleanPassword) {
      this.errorMessage = 'Password wajib diisi.';
      return;
    }

    this.isLoading = true;

    try {
      const result = await AuthService.loginStep1(cleanUsername, cleanPassword);
      console.log(`[LOGIN RESULT]`, JSON.stringify(result));

      if (result.success) {
        navigateTo('views/auth/pin-page');
      } else {
        this.errorMessage = result.error || 'Username atau password salah.';
      }
    } catch (err: any) {
      console.error('[LOGIN ERROR]', err);
      this.errorMessage = err.message || 'Terjadi kesalahan koneksi server.';
    } finally {
      this.isLoading = false;
    }
  }
}

let viewModel: LoginViewModel;

export function onNavigatingTo(args: EventData): void {
  const page = args.object as Page;

  // If already logged in, skip to main
  if (AuthService.isLoggedIn()) {
    navigateTo('views/main/main-page', undefined, true);
    return;
  }

  viewModel = new LoginViewModel();
  page.bindingContext = viewModel;
}

export function onTogglePassword(): void {
  if (viewModel) {
    viewModel.togglePassword();
  }
}

export function onLogin(args: EventData): void {
  const page = (args.object as any).page;
  if (page) {
    const userField = page.getViewById('usernameField') as TextField;
    const passField = page.getViewById('passwordField') as TextField;
    if (userField && typeof userField.text === 'string') {
      viewModel.username = userField.text;
    }
    if (passField && typeof passField.text === 'string') {
      viewModel.password = passField.text;
    }
  }

  if (viewModel) {
    viewModel.onLogin();
  }
}
