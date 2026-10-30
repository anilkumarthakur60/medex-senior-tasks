import { Service, PriceBreakdown, WellnessPriceOption } from '../types';

/**
 * Parses a decimal string safely into a float.
 * Returns fallback (default 0) if undefined, null, or empty.
 */
export function parseDecimalString(val: string | null | undefined, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = parseFloat(val);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * Calculates price components for a single item according to MedEx formula:
 * discountAmount = discountType === 'percent' ? price * discount / 100 : discount
 * afterDiscount  = price - discountAmount
 * chargeAmount   = serviceChargeType === 'percent' ? afterDiscount * serviceCharge / 100 : serviceCharge
 * finalPrice     = afterDiscount + chargeAmount
 */
export function calculateComponentPrice(
  rawPrice: number,
  discount: number,
  discountType: 'percent' | 'amount' | null,
  serviceCharge: number,
  serviceChargeType: 'percent' | 'amount' | null
): {
  originalPrice: number;
  discountAmount: number;
  afterDiscount: number;
  chargeAmount: number;
  finalPrice: number;
} {
  const originalPrice = rawPrice;
  const discountAmount =
    discountType === 'percent' ? (originalPrice * discount) / 100 : discount;
  const afterDiscount = Math.max(0, originalPrice - discountAmount);
  const chargeAmount =
    serviceChargeType === 'percent'
      ? (afterDiscount * serviceCharge) / 100
      : serviceCharge;
  const finalPrice = afterDiscount + chargeAmount;

  return {
    originalPrice,
    discountAmount,
    afterDiscount,
    chargeAmount,
    finalPrice,
  };
}

/**
 * Computes price breakdown for any service.
 * Handles normal services and wellness services with multiple duration options.
 */
export function calculateServicePrice(service: Service, currency: string): PriceBreakdown {
  if (service.type === 'wellness' || !service.price) {
    if (!service.wellnessPricing || service.wellnessPricing.length === 0) {
      return {
        originalPrice: 0,
        discountAmount: 0,
        afterDiscount: 0,
        chargeAmount: 0,
        finalPrice: 0,
        hasDiscount: false,
        hasServiceCharge: false,
        isWellness: true,
        minPrice: 0,
        maxPrice: 0,
        currency,
      };
    }

    const calculatedOptions = service.wellnessPricing.map((opt: WellnessPriceOption) => {
      const price = parseDecimalString(opt.price);
      const discount = parseDecimalString(opt.discount);
      const serviceCharge = parseDecimalString(opt.serviceCharge);
      return calculateComponentPrice(
        price,
        discount,
        opt.discountType,
        serviceCharge,
        opt.serviceChargeType
      );
    });

    const prices = calculatedOptions.map((o) => o.finalPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const lowestOption = calculatedOptions.find((o) => o.finalPrice === minPrice) || calculatedOptions[0];

    return {
      originalPrice: lowestOption.originalPrice,
      discountAmount: lowestOption.discountAmount,
      afterDiscount: lowestOption.afterDiscount,
      chargeAmount: lowestOption.chargeAmount,
      finalPrice: minPrice,
      hasDiscount: lowestOption.discountAmount > 0,
      hasServiceCharge: lowestOption.chargeAmount > 0,
      isWellness: true,
      minPrice,
      maxPrice,
      currency,
    };
  }

  const rawPrice = parseDecimalString(service.price);
  const discount = parseDecimalString(service.discount);
  const serviceCharge = parseDecimalString(service.serviceCharge);

  const calc = calculateComponentPrice(
    rawPrice,
    discount,
    service.discountType,
    serviceCharge,
    service.serviceChargeType
  );

  return {
    ...calc,
    hasDiscount: calc.discountAmount > 0,
    hasServiceCharge: calc.chargeAmount > 0,
    isWellness: false,
    currency,
  };
}

/**
 * Formats a currency amount with two decimal places.
 * e.g., formatCurrency(5970.6, 'THB') => "THB 5,970.60"
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${currency} ${formatted}`;
}
