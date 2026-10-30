import { Order, CartLineItem, PaymentMethod } from '../types';

// In-memory order storage
const ordersMap = new Map<string, Order>();
const idempotencyMap = new Map<string, Order>();

export function getOrder(orderId: string): Order | undefined {
  return ordersMap.get(orderId);
}

export function getAllOrders(): Order[] {
  return Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createOrRetrieveOrder(
  groupType: string,
  items: CartLineItem[],
  paymentMethod: PaymentMethod,
  idempotencyKey: string,
  subtotals: Record<string, number>,
  simulatedErrorType?: 'none' | 'payment_failed' | 'conflict_409' | 'server_500'
): { order?: Order; conflict?: boolean; error?: string; status: number } {
  // 1. Idempotency Check: if this key has already been processed, return that order!
  if (idempotencyMap.has(idempotencyKey)) {
    const existing = idempotencyMap.get(idempotencyKey)!;
    return { order: existing, status: 200 };
  }

  // 2. Simulated failure triggers
  if (simulatedErrorType === 'conflict_409') {
    return {
      conflict: true,
      error: 'Slot conflict: an appointment for one of these services was just claimed by another user.',
      status: 409,
    };
  }

  if (simulatedErrorType === 'server_500') {
    return {
      error: 'Internal server error processing checkout.',
      status: 500,
    };
  }

  if (simulatedErrorType === 'payment_failed') {
    const failedOrderId = `ORD-${Date.now().toString().slice(-6)}-FAIL`;
    const failedOrder: Order = {
      orderId: failedOrderId,
      groupType,
      items,
      paymentMethod,
      idempotencyKey,
      status: 'failed',
      subtotals,
      createdAt: new Date().toISOString(),
      errorMessage: 'Payment declined by bank or card issuer.',
    };
    ordersMap.set(failedOrderId, failedOrder);
    idempotencyMap.set(idempotencyKey, failedOrder);
    return {
      order: failedOrder,
      error: failedOrder.errorMessage,
      status: 402,
    };
  }

  // 3. Normal Success
  const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
    100 + Math.random() * 900
  )}`;

  const order: Order = {
    orderId,
    groupType,
    items,
    paymentMethod,
    idempotencyKey,
    status: paymentMethod === 'pay_at_clinic' ? 'pending' : 'paid',
    subtotals,
    createdAt: new Date().toISOString(),
  };

  ordersMap.set(orderId, order);
  idempotencyMap.set(idempotencyKey, order);

  return { order, status: 201 };
}
