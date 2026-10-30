import { Cart, CartGroup, CartLineItem } from '../types';

/**
 * Checks whether an item's product is unavailable (removed by provider).
 */
export function isItemUnavailable(item: CartLineItem): boolean {
  if (!item.product) return true;
  if (Object.keys(item.product).length === 0) return true;
  if (!item.product.id || !item.product.title) return true;
  return false;
}

/**
 * Calculates effective unit price for a line item.
 * For standard items: product.price
 * For wellness items: price from selected wellnessPricing option
 */
export function getItemEffectiveUnitPrice(item: CartLineItem): number | null {
  if (isItemUnavailable(item)) return null;

  if (item.product.type === 'wellness' || item.product.priceUnknown) {
    if (!item.wellnessPricingId || !item.product.wellnessPricing) return null;
    const option = item.product.wellnessPricing.find(
      (opt) => opt.id === item.wellnessPricingId
    );
    return option ? option.amount_after_service_charge : null;
  }

  return item.product.price ?? null;
}

/**
 * Recalculates group and cart metrics:
 * - itemCount (sum of quantities)
 * - unpricedItems (items with unknown price / duration not selected)
 * - subtotals per currency
 * - totalItems
 */
export function recalculateCart(cart: Cart): Cart {
  const recalculatedGroups: CartGroup[] = [];

  for (const group of cart.groups) {
    if (group.items.length === 0) continue;

    let itemCount = 0;
    let unpricedItems = 0;
    const subtotals: Record<string, number> = {};

    for (const item of group.items) {
      itemCount += item.quantity;

      if (isItemUnavailable(item)) {
        unpricedItems++;
        continue;
      }

      const unitPrice = getItemEffectiveUnitPrice(item);
      if (unitPrice === null) {
        unpricedItems++;
      } else {
        const currency = item.product.currency || 'USD';
        const lineTotal = unitPrice * item.quantity;
        subtotals[currency] = (subtotals[currency] || 0) + lineTotal;
      }
    }

    recalculatedGroups.push({
      ...group,
      itemCount,
      unpricedItems,
      subtotals,
    });
  }

  const totalItems = recalculatedGroups.reduce((acc, g) => acc + g.itemCount, 0);

  return {
    groups: recalculatedGroups,
    totalItems,
  };
}

/**
 * Evaluates whether a group is ready for checkout.
 */
export function canGroupCheckout(group: CartGroup): {
  allowed: boolean;
  reason?: string;
} {
  if (group.items.length === 0) {
    return { allowed: false, reason: 'This group is empty.' };
  }

  const hasUnavailable = group.items.some(isItemUnavailable);
  if (hasUnavailable) {
    return {
      allowed: false,
      reason: 'Contains services no longer available. Please remove them before checkout.',
    };
  }

  if (group.unpricedItems > 0) {
    return {
      allowed: false,
      reason: 'Please choose duration options for all wellness services.',
    };
  }

  return { allowed: true };
}
