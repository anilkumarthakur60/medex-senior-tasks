import { describe, it, expect } from 'vitest';
import {
  parseDecimalString,
  calculateComponentPrice,
  calculateServicePrice,
  formatCurrency,
} from '../priceCalc';
import { Service } from '../../types';

describe('priceCalc', () => {
  describe('parseDecimalString', () => {
    it('parses valid decimal strings correctly', () => {
      expect(parseDecimalString('6200.00')).toBe(6200);
      expect(parseDecimalString('10.50')).toBe(10.5);
      expect(parseDecimalString('0.00')).toBe(0);
    });

    it('handles null, undefined, empty, and invalid strings gracefully', () => {
      expect(parseDecimalString(null)).toBe(0);
      expect(parseDecimalString(undefined)).toBe(0);
      expect(parseDecimalString('')).toBe(0);
      expect(parseDecimalString('invalid')).toBe(0);
      expect(parseDecimalString(null, 100)).toBe(100);
    });
  });

  describe('calculateComponentPrice', () => {
    it('calculates price with percent discount and percent service charge accurately', () => {
      // 6200 - 10% discount = 5580.
      // 5580 + 7% service charge = 5580 + 390.6 = 5970.6
      const result = calculateComponentPrice(6200, 10, 'percent', 7, 'percent');
      expect(result.originalPrice).toBe(6200);
      expect(result.discountAmount).toBe(620);
      expect(result.afterDiscount).toBe(5580);
      expect(result.chargeAmount).toBe(390.6);
      expect(result.finalPrice).toBe(5970.6);
    });

    it('calculates price with amount discount and amount service charge', () => {
      // 5000 - 500 = 4500. 4500 + 200 = 4700.
      const result = calculateComponentPrice(5000, 500, 'amount', 200, 'amount');
      expect(result.discountAmount).toBe(500);
      expect(result.afterDiscount).toBe(4500);
      expect(result.chargeAmount).toBe(200);
      expect(result.finalPrice).toBe(4700);
    });

    it('does not produce negative price if discount exceeds price', () => {
      const result = calculateComponentPrice(100, 200, 'amount', 0, 'amount');
      expect(result.afterDiscount).toBe(0);
      expect(result.finalPrice).toBe(0);
    });
  });

  describe('calculateServicePrice', () => {
    it('handles standard service with percent discount and charge', () => {
      const service: Service = {
        id: 'test-1',
        title: 'Executive Checkup',
        slug: 'exec-checkup',
        type: 'package',
        userId: 48,
        categoryId: 'cat-1',
        subCategoryId: null,
        price: '6200.00',
        discount: '10.00',
        discountType: 'percent',
        serviceCharge: '7.00',
        serviceChargeType: 'percent',
        status: true,
        testAtHome: false,
        homeTestCharge: null,
        wellnessPricing: [],
        createdAt: '2025-01-01T00:00:00Z',
      };

      const breakdown = calculateServicePrice(service, 'THB');
      expect(breakdown.originalPrice).toBe(6200);
      expect(breakdown.discountAmount).toBe(620);
      expect(breakdown.afterDiscount).toBe(5580);
      expect(breakdown.chargeAmount).toBe(390.6);
      expect(breakdown.finalPrice).toBe(5970.6);
      expect(breakdown.hasDiscount).toBe(true);
      expect(breakdown.hasServiceCharge).toBe(true);
      expect(breakdown.isWellness).toBe(false);
      expect(breakdown.currency).toBe('THB');
    });

    it('handles wellness service with multiple durations and picks lowest option as minPrice', () => {
      const wellnessService: Service = {
        id: 'wellness-1',
        title: 'Signature Facial',
        slug: 'signature-facial',
        type: 'wellness',
        userId: 61,
        categoryId: null,
        subCategoryId: null,
        price: null,
        discount: null,
        discountType: null,
        serviceCharge: null,
        serviceChargeType: null,
        status: true,
        testAtHome: false,
        homeTestCharge: null,
        wellnessPricing: [
          {
            id: 'opt-60',
            durationInMinutes: 60,
            price: '1800.00',
            discount: '0.00',
            discountType: 'amount',
            serviceCharge: '0.00',
            serviceChargeType: 'amount',
          },
          {
            id: 'opt-90',
            durationInMinutes: 90,
            price: '2400.00',
            discount: '15.00',
            discountType: 'percent',
            serviceCharge: '0.00',
            serviceChargeType: 'amount',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
      };

      const breakdown = calculateServicePrice(wellnessService, 'THB');
      expect(breakdown.isWellness).toBe(true);
      // Option 1: 1800
      // Option 2: 2400 - 15% (360) = 2040
      expect(breakdown.minPrice).toBe(1800);
      expect(breakdown.maxPrice).toBe(2040);
      expect(breakdown.finalPrice).toBe(1800);
    });
  });

  describe('formatCurrency', () => {
    it('formats numbers with 2 decimal places and currency prefix', () => {
      expect(formatCurrency(5970.6, 'THB')).toBe('THB 5,970.60');
      expect(formatCurrency(12000, 'NPR')).toBe('NPR 12,000.00');
      expect(formatCurrency(0, 'INR')).toBe('INR 0.00');
    });
  });
});
