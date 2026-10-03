export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'kasir';
  created_at?: string;
  updated_at?: string;
}

export interface LoginStep1Response {
  success: boolean;
  requirePin?: boolean;
  tempToken?: string;
  error?: string;
}

export interface LoginPinResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
