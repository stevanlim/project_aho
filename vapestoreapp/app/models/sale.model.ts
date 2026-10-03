export type PaymentMethod = 'Cash' | 'QRIS' | 'Transfer' | 'Other';

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  subtotal: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  status: 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleListResponse {
  sales: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CheckoutItemRequest {
  productId?: number;
  product_id?: number;
  productName?: string;
  product_name?: string;
  quantity: number;
  unitPrice?: number;
  unit_price?: number;
  purchasePrice?: number;
  purchase_price?: number;
  subtotal?: number;
}

export interface CheckoutRequest {
  items: CheckoutItemRequest[];
  discount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
}

export interface CheckoutResponse {
  success: boolean;
  saleId: number;
  invoiceNumber: string;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  subtotal: number;
  photo?: string | null;
  stock: number;
}
