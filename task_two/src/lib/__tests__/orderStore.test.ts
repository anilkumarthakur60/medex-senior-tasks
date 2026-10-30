import { describe, it, expect } from 'vitest';
import { createOrRetrieveOrder } from '../orderStore';
import { CartLineItem } from '../../types';

describe('orderStore', () => {
  const sampleItems: CartLineItem[] = [
    {
      id: 'line-1',
      productId: 'prod-1',
      quantity: 1,
      product: {
        id: 'prod-1',
        title: 'Executive Checkup',
        type: 'package',
        currency: 'THB',
        price: 5000,
        providerId: 10,
        providerName: 'Hospital A',
      },
    },
  ];

  it('creates an order successfully with status 201', () => {
    const key = `idem-test-${Date.now()}-1`;
    const result = createOrRetrieveOrder(
      'package',
      sampleItems,
      'card',
      key,
      { THB: 5000 }
    );

    expect(result.status).toBe(201);
    expect(result.order).toBeDefined();
    expect(result.order?.orderId).toMatch(/^ORD-/);
    expect(result.order?.status).toBe('paid');
  });

  it('guarantees idempotency: reusing same idempotencyKey returns existing order and never duplicates charge', () => {
    const key = `idem-test-duplicate-${Date.now()}`;

    // First attempt
    const firstAttempt = createOrRetrieveOrder(
      'package',
      sampleItems,
      'card',
      key,
      { THB: 5000 }
    );
    expect(firstAttempt.status).toBe(201);
    const originalOrderId = firstAttempt.order?.orderId;

    // Second attempt with exact same key (e.g. user retried or double-clicked)
    const secondAttempt = createOrRetrieveOrder(
      'package',
      sampleItems,
      'card',
      key,
      { THB: 5000 }
    );

    expect(secondAttempt.status).toBe(200);
    expect(secondAttempt.order?.orderId).toBe(originalOrderId);
    expect(secondAttempt.order?.idempotencyKey).toBe(key);
  });

  it('handles simulated payment failure correctly', () => {
    const key = `idem-test-fail-${Date.now()}`;
    const result = createOrRetrieveOrder(
      'package',
      sampleItems,
      'card',
      key,
      { THB: 5000 },
      'payment_failed'
    );

    expect(result.status).toBe(402);
    expect(result.error).toContain('declined');
    expect(result.order?.status).toBe('failed');
  });

  it('handles simulated slot conflict 409', () => {
    const key = `idem-test-conflict-${Date.now()}`;
    const result = createOrRetrieveOrder(
      'package',
      sampleItems,
      'card',
      key,
      { THB: 5000 },
      'conflict_409'
    );

    expect(result.status).toBe(409);
    expect(result.conflict).toBe(true);
  });
});
