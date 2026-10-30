import fs from 'fs';
import path from 'path';
import {
  Cart,
  CartLineItem,
  GuestCartItem,
  Product,
  MergeResponse,
  CartMergeChange,
} from '../types';
import { recalculateCart } from './cartCalculations';

// Module-level in-memory state
let currentCart: Cart | null = null;
let catalog: Product[] = [];

function loadData() {
  const filePath = path.join(process.cwd(), 'data', 'task2-cart.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);
  catalog = data.catalog || [];
  currentCart = JSON.parse(JSON.stringify(data.serverCart));
  if (currentCart) {
    currentCart = recalculateCart(currentCart);
  }
}

export function getCart(): Cart {
  if (!currentCart) {
    loadData();
  }
  return currentCart!;
}

export function resetCartToInitial(): Cart {
  loadData();
  return currentCart!;
}

export function updateItemQuantity(lineId: string, quantity: number): Cart {
  const cart = getCart();

  for (const group of cart.groups) {
    const itemIndex = group.items.findIndex((item) => item.id === lineId);
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        group.items.splice(itemIndex, 1);
      } else {
        group.items[itemIndex].quantity = quantity;
      }
      break;
    }
  }

  currentCart = recalculateCart(cart);
  return currentCart;
}

export function updateItemWellnessOption(lineId: string, wellnessPricingId: string): Cart {
  const cart = getCart();

  for (const group of cart.groups) {
    const item = group.items.find((i) => i.id === lineId);
    if (item) {
      item.wellnessPricingId = wellnessPricingId;
      break;
    }
  }

  currentCart = recalculateCart(cart);
  return currentCart;
}

export function removeItem(lineId: string): Cart {
  const cart = getCart();

  for (const group of cart.groups) {
    const itemIndex = group.items.findIndex((item) => item.id === lineId);
    if (itemIndex !== -1) {
      group.items.splice(itemIndex, 1);
      break;
    }
  }

  currentCart = recalculateCart(cart);
  return currentCart;
}

export function removeItems(itemIds: string[]): Cart {
  const cart = getCart();
  const idSet = new Set(itemIds);

  for (const group of cart.groups) {
    group.items = group.items.filter((item) => !idSet.has(item.id));
  }

  currentCart = recalculateCart(cart);
  return currentCart;
}

export function mergeGuestCart(guestItems: GuestCartItem[]): MergeResponse {
  const cart = getCart();
  const changes: CartMergeChange[] = [];

  if (catalog.length === 0) {
    loadData();
  }

  const catalogMap = new Map<string, Product>();
  for (const prod of catalog) {
    if (prod.id) catalogMap.set(prod.id, prod);
  }

  for (const guestItem of guestItems) {
    const product = catalogMap.get(guestItem.productId);
    const title = product?.title || 'Unknown Product';

    // Check if this item already exists in serverCart
    let found = false;
    for (const group of cart.groups) {
      const existing = group.items.find((it) => it.productId === guestItem.productId);
      if (existing) {
        found = true;
        // Merge quantities (e.g. 2 + 3 = 5)
        const oldQty = existing.quantity;
        existing.quantity += guestItem.quantity;

        // If guest specified wellness duration, update it
        if (guestItem.wellnessPricingId) {
          existing.wellnessPricingId = guestItem.wellnessPricingId;
          changes.push({
            type: 'wellness_option_set',
            productId: guestItem.productId,
            title,
            details: `Duration option set for "${title}" from guest cart.`,
          });
        }

        changes.push({
          type: 'quantity_updated',
          productId: guestItem.productId,
          title,
          details: `Increased quantity of "${title}" from ${oldQty} to ${existing.quantity}.`,
        });
        break;
      }
    }

    if (!found) {
      // Add new item into matching group
      const prodType = product?.type || 'package';
      let group = cart.groups.find((g) => g.type === prodType);
      if (!group) {
        group = {
          type: prodType,
          itemCount: 0,
          unpricedItems: 0,
          subtotals: {},
          items: [],
        };
        cart.groups.push(group);
      }

      const newLineItem: CartLineItem = {
        id: `guest-line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: guestItem.productId,
        quantity: guestItem.quantity,
        wellnessPricingId: guestItem.wellnessPricingId || null,
        product: product || {},
      };

      group.items.push(newLineItem);
      changes.push({
        type: 'item_added',
        productId: guestItem.productId,
        title,
        details: `Added ${guestItem.quantity}x "${title}" to your cart.`,
      });
    }
  }

  currentCart = recalculateCart(cart);
  return {
    cart: currentCart,
    changes,
  };
}
