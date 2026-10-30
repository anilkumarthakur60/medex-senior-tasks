import { describe, it, expect } from 'vitest';
import {
  isItemUnavailable,
  getItemEffectiveUnitPrice,
  recalculateCart,
  canGroupCheckout,
} from '../cartCalculations';
import { Cart, CartGroup, CartLineItem } from '../../types';

describe('cartCalculations', () => {
  const normalItem: CartLineItem = {
    id: 'item-1',
    productId: 'prod-1',
    quantity: 2,
    product: {
      id: 'prod-1',
      title: 'CBC Blood Test',
      type: 'lab_test',
      currency: 'THB',
      price: 1500,
      providerId: 10,
      providerName: 'Bangkok Lab',
    },
  };

  const emptyProductItem: CartLineItem = {
    id: 'item-empty',
    productId: 'prod-deleted',
    quantity: 1,
    product: {},
  };

  const wellnessItemNoDuration: CartLineItem = {
    id: 'item-wellness',
    productId: 'prod-wellness',
    quantity: 1,
    wellnessPricingId: null,
    product: {
      id: 'prod-wellness',
      title: 'Thai Massage',
      type: 'wellness',
      currency: 'THB',
      price: null,
      priceUnknown: true,
      wellnessPricing: [
        { id: 'dur-60', durationInMinutes: 60, amount_after_service_charge: 800 },
        { id: 'dur-90', durationInMinutes: 90, amount_after_service_charge: 1200 },
      ],
    },
  };

  const wellnessItemWithDuration: CartLineItem = {
    ...wellnessItemNoDuration,
    id: 'item-wellness-selected',
    wellnessPricingId: 'dur-90',
  };

  describe('isItemUnavailable', () => {
    it('detects empty product object as unavailable', () => {
      expect(isItemUnavailable(emptyProductItem)).toBe(true);
    });

    it('identifies standard product as available', () => {
      expect(isItemUnavailable(normalItem)).toBe(false);
    });
  });

  describe('getItemEffectiveUnitPrice', () => {
    it('returns standard product price', () => {
      expect(getItemEffectiveUnitPrice(normalItem)).toBe(1500);
    });

    it('returns null for unavailable product', () => {
      expect(getItemEffectiveUnitPrice(emptyProductItem)).toBe(null);
    });

    it('returns null for wellness product without duration selected', () => {
      expect(getItemEffectiveUnitPrice(wellnessItemNoDuration)).toBe(null);
    });

    it('returns amount_after_service_charge for wellness product with duration selected', () => {
      expect(getItemEffectiveUnitPrice(wellnessItemWithDuration)).toBe(1200);
    });
  });

  describe('recalculateCart', () => {
    it('computes separate subtotals per currency and never mixes them', () => {
      const nprItem: CartLineItem = {
        id: 'item-npr',
        productId: 'prod-npr',
        quantity: 1,
        product: {
          id: 'prod-npr',
          title: 'Kathmandu Health Screening',
          type: 'lab_test',
          currency: 'NPR',
          price: 5000,
          providerId: 20,
          providerName: 'Himal Clinic',
        },
      };

      const group: CartGroup = {
        type: 'lab_test',
        itemCount: 0,
        unpricedItems: 0,
        subtotals: {},
        items: [normalItem, nprItem],
      };

      const cart: Cart = {
        groups: [group],
        totalItems: 0,
      };

      const calculated = recalculateCart(cart);
      expect(calculated.totalItems).toBe(3); // 2 normalItem + 1 nprItem
      expect(calculated.groups[0].subtotals['THB']).toBe(3000); // 2 * 1500
      expect(calculated.groups[0].subtotals['NPR']).toBe(5000); // 1 * 5000
    });

    it('marks unpriced items count and excludes them from subtotal until duration chosen', () => {
      const group: CartGroup = {
        type: 'wellness',
        itemCount: 0,
        unpricedItems: 0,
        subtotals: {},
        items: [wellnessItemNoDuration],
      };

      const cart: Cart = { groups: [group], totalItems: 0 };
      const calculated = recalculateCart(cart);

      expect(calculated.groups[0].unpricedItems).toBe(1);
      expect(calculated.groups[0].subtotals).toEqual({});
    });
  });

  describe('canGroupCheckout', () => {
    it('disallows checkout when group contains unavailable items', () => {
      const group: CartGroup = {
        type: 'lab_test',
        itemCount: 2,
        unpricedItems: 1,
        subtotals: {},
        items: [normalItem, emptyProductItem],
      };
      const check = canGroupCheckout(group);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('services no longer available');
    });

    it('disallows checkout when group contains unpriced wellness items', () => {
      const group: CartGroup = {
        type: 'wellness',
        itemCount: 1,
        unpricedItems: 1,
        subtotals: {},
        items: [wellnessItemNoDuration],
      };
      const check = canGroupCheckout(group);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('duration options');
    });

    it('allows checkout when all items in group are priced and available', () => {
      const group: CartGroup = {
        type: 'lab_test',
        itemCount: 2,
        unpricedItems: 0,
        subtotals: { THB: 3000 },
        items: [normalItem],
      };
      const check = canGroupCheckout(group);
      expect(check.allowed).toBe(true);
    });
  });
});
