import { ApiService } from './api.service';
import { CheckoutRequest, CheckoutResponse, Sale, CartItem } from '../models/sale.model';

// In-memory cart state
let _cart: CartItem[] = [];

export class PosService {
  /**
   * Get current cart items
   */
  public static getCart(): CartItem[] {
    return _cart;
  }

  /**
   * Add item to cart
   */
  public static addToCart(item: CartItem): void {
    const existing = _cart.find(c => c.product_id === item.product_id);
    if (existing) {
      if (existing.quantity + item.quantity > item.stock) {
        throw new Error(`Stok tidak mencukupi. Tersedia: ${item.stock} ${item.product_name}`);
      }
      existing.quantity += item.quantity;
      existing.subtotal = existing.quantity * existing.unit_price;
    } else {
      _cart.push({ ...item });
    }
  }

  /**
   * Update item quantity in cart
   */
  public static updateQuantity(productId: number, quantity: number): void {
    const item = _cart.find(c => c.product_id === productId);
    if (!item) return;
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    if (quantity > item.stock) {
      throw new Error(`Stok tidak mencukupi. Tersedia: ${item.stock}`);
    }
    item.quantity = quantity;
    item.subtotal = quantity * item.unit_price;
  }

  /**
   * Remove item from cart
   */
  public static removeFromCart(productId: number): void {
    _cart = _cart.filter(c => c.product_id !== productId);
  }

  /**
   * Clear cart
   */
  public static clearCart(): void {
    _cart = [];
  }

  /**
   * Get cart totals
   */
  public static getCartTotals(discount: number = 0): {
    itemCount: number;
    subtotal: number;
    discount: number;
    grandTotal: number;
  } {
    const itemCount = _cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = _cart.reduce((sum, item) => sum + item.subtotal, 0);
    const grandTotal = Math.max(0, subtotal - discount);
    return { itemCount, subtotal, discount, grandTotal };
  }

  /**
   * Process checkout
   */
  public static async checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const result = await ApiService.post<CheckoutResponse>('/api/pos/checkout', request);
    if (result.success) {
      _cart = [];
    }
    return result;
  }
}
