export type ServiceType = 'package' | 'lab_test' | 'wellness' | 'service' | 'insurance' | 'unknown';

export interface WellnessPriceOption {
  id: string;
  durationInMinutes: number;
  amount_after_service_charge: number;
}

export interface Product {
  id?: string;
  title?: string;
  type?: ServiceType | string;
  currency?: string;
  providerId?: number;
  providerName?: string;
  price?: number | null;
  priceUnknown?: boolean;
  wellnessPricing?: WellnessPriceOption[];
}

export interface CartLineItem {
  id: string;
  productId: string;
  quantity: number;
  wellnessPricingId?: string | null;
  product: Product;
}

export interface CartGroup {
  type: string;
  itemCount: number;
  unpricedItems: number;
  subtotals: Record<string, number>;
  items: CartLineItem[];
}

export interface Cart {
  groups: CartGroup[];
  totalItems: number;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  wellnessPricingId?: string;
}

export type PaymentMethod = 'card' | 'pay_at_clinic';

export type OrderStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  orderId: string;
  groupType: string;
  items: CartLineItem[];
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  status: OrderStatus;
  subtotals: Record<string, number>;
  createdAt: string;
  errorMessage?: string;
}

export interface CartMergeChange {
  type: 'quantity_updated' | 'item_added' | 'wellness_option_set';
  productId: string;
  title: string;
  details: string;
}

export interface MergeResponse {
  cart: Cart;
  changes: CartMergeChange[];
}

export type GroupCheckoutState =
  | { status: 'idle' }
  | { status: 'submitting'; paymentMethod: PaymentMethod }
  | { status: 'success'; order: Order }
  | { status: 'failed'; error: string; paymentMethod: PaymentMethod };
