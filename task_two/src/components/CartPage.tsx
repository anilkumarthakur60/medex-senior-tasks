'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Cart,
  PaymentMethod,
  Order,
  CartMergeChange,
  GroupCheckoutState,
} from '../types';
import { canGroupCheckout } from '../lib/cartCalculations';
import { CartGroupView } from './CartGroupView';
import { CurrencySummary } from './CurrencySummary';
import { GuestCartMergeBanner } from './GuestCartMergeBanner';
import { OrderSummaryCard } from './OrderSummaryCard';
import { CartSkeleton } from './Skeleton';
import { DevPanel, CheckoutSimMode } from './DevPanel';

const SESSION_STORAGE_ORDERS_KEY = 'medex_cart_orders_v1';
const SESSION_STORAGE_IDEMPOTENCY_KEY = 'medex_idempotency_keys_v1';

export function CartPage() {
  const queryClient = useQueryClient();

  // Simulated latency & failure mode
  const [delay, setDelay] = useState(300);
  const [checkoutSimMode, setCheckoutSimMode] = useState<CheckoutSimMode>('normal');

  // Checkout states per group type
  const [groupCheckoutStates, setGroupCheckoutStates] = useState<
    Record<string, GroupCheckoutState>
  >({});
  const [isGlobalCheckingOut, setIsGlobalCheckingOut] = useState(false);
  const [isMergingGuestCart, setIsMergingGuestCart] = useState(false);
  const [isResettingCart, setIsResettingCart] = useState(false);

  // Orders list (persisted in sessionStorage for reload safety!)
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save orders to sessionStorage when updated
  const saveOrders = (updated: Order[]) => {
    setOrders(updated);
    try {
      sessionStorage.setItem(SESSION_STORAGE_ORDERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Helper to get or generate persistent idempotency key per group
  const getIdempotencyKey = (groupType: string): string => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_IDEMPOTENCY_KEY);
      const map: Record<string, string> = raw ? JSON.parse(raw) : {};
      if (!map[groupType]) {
        map[groupType] = `idem-${groupType}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem(SESSION_STORAGE_IDEMPOTENCY_KEY, JSON.stringify(map));
      }
      return map[groupType];
    } catch {
      return `idem-${groupType}-${Date.now()}`;
    }
  };

  const clearIdempotencyKey = (groupType: string) => {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_IDEMPOTENCY_KEY);
      if (raw) {
        const map: Record<string, string> = JSON.parse(raw);
        delete map[groupType];
        sessionStorage.setItem(SESSION_STORAGE_IDEMPOTENCY_KEY, JSON.stringify(map));
      }
    } catch {
      // ignore
    }
  };

  // --- Fetch Cart ---
  const { data, isLoading, isError, refetch } = useQuery<{ cart: Cart }>({
    queryKey: ['cart', delay],
    queryFn: async () => {
      const res = await fetch(`/api/cart?delay=${delay}`);
      if (!res.ok) throw new Error('Failed to load cart');
      return res.json();
    },
  });

  const cart = data?.cart;

  // --- Optimistic Quantity Update ---
  const handleUpdateQuantity = async (lineId: string, quantity: number): Promise<boolean> => {
    const previousData = queryClient.getQueryData<{ cart: Cart }>(['cart', delay]);

    // Optimistically update React Query cache
    queryClient.setQueryData<{ cart: Cart }>(['cart', delay], (old) => {
      if (!old) return old;
      const newGroups = old.cart.groups.map((group) => {
        const item = group.items.find((i) => i.id === lineId);
        if (!item) return group;
        return {
          ...group,
          items: group.items.map((i) =>
            i.id === lineId ? { ...i, quantity } : i
          ),
        };
      });
      return {
        cart: {
          ...old.cart,
          groups: newGroups,
        },
      };
    });

    try {
      const res = await fetch(`/api/cart/items/${lineId}?delay=0`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        throw new Error('Server rejected quantity update');
      }

      const resData = await res.json();
      queryClient.setQueryData(['cart', delay], { cart: resData.cart });
      return true;
    } catch {
      // Rollback cache
      if (previousData) {
        queryClient.setQueryData(['cart', delay], previousData);
      }
      return false;
    }
  };

  // --- Update Wellness Duration Option ---
  const handleUpdateWellnessOption = async (lineId: string, wellnessPricingId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${lineId}?delay=0`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wellnessPricingId }),
      });
      if (res.ok) {
        const resData = await res.json();
        queryClient.setQueryData(['cart', delay], { cart: resData.cart });
      }
    } catch {
      // ignore
    }
  };

  // --- Remove Line Item ---
  const handleRemoveItem = async (lineId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${lineId}?delay=0`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const resData = await res.json();
        queryClient.setQueryData(['cart', delay], { cart: resData.cart });
      }
    } catch {
      // ignore
    }
  };

  // --- Single Group Checkout ---
  const handleCheckoutGroup = async (
    groupType: string,
    paymentMethod: PaymentMethod,
    existingIdempotencyKey?: string
  ): Promise<boolean> => {
    const group = cart?.groups.find((g) => g.type === groupType);
    if (!group) return false;

    const validation = canGroupCheckout(group);
    if (!validation.allowed) return false;

    setGroupCheckoutStates((prev) => ({
      ...prev,
      [groupType]: { status: 'submitting', paymentMethod },
    }));

    const idempotencyKey = existingIdempotencyKey || getIdempotencyKey(groupType);

    // Build URL with dev query simulation flags
    let checkoutUrl = `/api/checkout?delay=${delay}`;
    if (checkoutSimMode === 'payment_fail') checkoutUrl += '&payment_fail=1';
    else if (checkoutSimMode === 'conflict_409') checkoutUrl += '&conflict=1';
    else if (checkoutSimMode === 'server_500') checkoutUrl += '&fail=1';

    try {
      const res = await fetch(checkoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupType,
          items: group.items,
          paymentMethod,
          idempotencyKey,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        const errorMsg = resData.error || 'Checkout failed';
        setGroupCheckoutStates((prev) => ({
          ...prev,
          [groupType]: { status: 'failed', error: errorMsg, paymentMethod },
        }));

        if (resData.orderId) {
          // If server created a failed order record
          const failedOrder: Order = {
            orderId: resData.orderId,
            groupType,
            items: group.items,
            paymentMethod,
            idempotencyKey,
            status: 'failed',
            subtotals: group.subtotals,
            createdAt: new Date().toISOString(),
            errorMessage: errorMsg,
          };
          saveOrders([failedOrder, ...orders.filter((o) => o.orderId !== resData.orderId)]);
        }
        return false;
      }

      // Success
      clearIdempotencyKey(groupType);
      const confirmedOrder: Order = resData.order;

      setGroupCheckoutStates((prev) => ({
        ...prev,
        [groupType]: { status: 'success', order: confirmedOrder },
      }));

      saveOrders([confirmedOrder, ...orders.filter((o) => o.orderId !== confirmedOrder.orderId)]);

      // Refresh cart
      refetch();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error during checkout';
      setGroupCheckoutStates((prev) => ({
        ...prev,
        [groupType]: {
          status: 'failed',
          error: message,
          paymentMethod,
        },
      }));
      return false;
    }
  };

  // --- Checkout All Available Groups (Split Checkout) ---
  const handleCheckoutAll = async () => {
    if (!cart) return;
    setIsGlobalCheckingOut(true);

    const checkableGroups = cart.groups.filter((g) => canGroupCheckout(g).allowed);

    for (const group of checkableGroups) {
      // Execute each group checkout independently
      await handleCheckoutGroup(group.type, 'card');
    }

    setIsGlobalCheckingOut(false);
  };

  // --- Guest Cart Merge ---
  const handleMergeGuestCart = async (): Promise<CartMergeChange[] | null> => {
    setIsMergingGuestCart(true);
    try {
      // Guest cart items from task2-cart.json
      const guestItems = [
        { productId: '7bcdaf5b-7874-4061-83ee-ef9c954ffcaf', quantity: 3 },
        { productId: '6a92d368-a25a-4e00-89ce-77d69da06b45', quantity: 1 },
        {
          productId: '5f0c1a52-6b1e-4c1f-9a51-000000000003',
          quantity: 1,
          wellnessPricingId: 'a1b2c3d4-0000-4000-8000-000000000090',
        },
        { productId: '6b572fa4-4559-4dfd-a276-9c1400ce208e', quantity: 1 },
      ];

      const res = await fetch(`/api/cart/merge?delay=${delay}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: guestItems }),
      });

      if (!res.ok) throw new Error('Failed to merge guest cart');

      const data = await res.json();
      queryClient.setQueryData(['cart', delay], { cart: data.cart });
      return data.changes;
    } catch {
      return null;
    } finally {
      setIsMergingGuestCart(false);
    }
  };

  // --- Reset Cart to Initial Data ---
  const handleResetCart = async () => {
    setIsResettingCart(true);
    try {
      const res = await fetch('/api/cart/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        queryClient.setQueryData(['cart', delay], { cart: data.cart });
        setGroupCheckoutStates({});
        saveOrders([]);
      }
    } finally {
      setIsResettingCart(false);
    }
  };

  const hasAnyValidGroup = Boolean(
    cart && cart.groups.some((g) => canGroupCheckout(g).allowed)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-sm">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                MedEx <span className="text-teal-600">Cart & Split Checkout</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Multi-provider orders with independent payment routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {cart ? `${cart.totalItems} Items` : 'Loading...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Guest Cart Merge Notification */}
        <GuestCartMergeBanner
          onMerge={handleMergeGuestCart}
          isMerging={isMergingGuestCart}
        />

        {/* Confirmed Orders / Partial Failure status */}
        {orders.length > 0 && (
          <OrderSummaryCard
            orders={orders}
            onRetryOrder={(type, method, key) =>
              handleCheckoutGroup(type, method, key)
            }
          />
        )}

        {isLoading && <CartSkeleton />}

        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
            <h3 className="text-base font-bold text-rose-900">Failed to load cart</h3>
            <p className="text-xs text-rose-700">
              Unable to retrieve cart data from server.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && cart && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Cart Groups */}
            <div className="lg:col-span-2 space-y-6">
              {cart.groups.length > 0 ? (
                cart.groups.map((group) => (
                  <CartGroupView
                    key={group.type}
                    group={group}
                    onUpdateQuantity={handleUpdateQuantity}
                    onUpdateWellnessOption={handleUpdateWellnessOption}
                    onRemoveItem={handleRemoveItem}
                    onCheckoutGroup={handleCheckoutGroup}
                    checkoutState={groupCheckoutStates[group.type]}
                    isGlobalCheckingOut={isGlobalCheckingOut}
                  />
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500">
                    All items have been checked out or removed.
                  </p>
                  <button
                    onClick={handleResetCart}
                    className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                  >
                    Restore Sample Items
                  </button>
                </div>
              )}
            </div>

            {/* Right: Currency Breakdown & Split Checkout All */}
            <div className="lg:col-span-1 sticky top-22">
              <CurrencySummary
                cart={cart}
                onCheckoutAll={handleCheckoutAll}
                isCheckingOut={isGlobalCheckingOut}
                canCheckoutAny={hasAnyValidGroup}
              />
            </div>
          </div>
        )}
      </main>

      {/* Dev Panel for Failure & Latency Injection */}
      <DevPanel
        delay={delay}
        onDelayChange={setDelay}
        checkoutSimMode={checkoutSimMode}
        onCheckoutSimModeChange={setCheckoutSimMode}
        onResetCart={handleResetCart}
        isResetting={isResettingCart}
      />
    </div>
  );
}
