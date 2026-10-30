'use client';

import React, { useState, useRef } from 'react';
import { CartLineItem } from '../types';
import { isItemUnavailable, getItemEffectiveUnitPrice } from '../lib/cartCalculations';
import { WellnessDurationPicker } from './WellnessDurationPicker';

interface CartItemRowProps {
  item: CartLineItem;
  onUpdateQuantity: (lineId: string, quantity: number) => Promise<boolean>;
  onUpdateWellnessOption: (lineId: string, optionId: string) => void;
  onRemoveItem: (lineId: string) => void;
  isMutating: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onUpdateWellnessOption,
  onRemoveItem,
  isMutating,
}: CartItemRowProps) {
  const isUnavailable = isItemUnavailable(item);
  const [localQty, setLocalQty] = useState(item.quantity);
  const [prevItemQty, setPrevItemQty] = useState(item.quantity);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local quantity with server quantity when item updates from outside
  if (item.quantity !== prevItemQty) {
    setPrevItemQty(item.quantity);
    setLocalQty(item.quantity);
  }

  const changeQuantity = (delta: number) => {
    const nextQty = Math.max(1, localQty + delta);
    setLocalQty(nextQty);

    // Debounce rapid clicks so 5 quick clicks send 1 network request with final qty
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const success = await onUpdateQuantity(item.id, nextQty);
      if (!success) {
        // Rollback to item.quantity on server failure
        setLocalQty(item.quantity);
      }
    }, 350);
  };

  const effectiveUnitPrice = getItemEffectiveUnitPrice(item);
  const currency = item.product.currency || 'USD';

  if (isUnavailable) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Service Unavailable
            </span>
            <p className="text-sm font-medium text-slate-800">
              This service has been discontinued or removed by the healthcare provider.
            </p>
            <p className="text-xs text-rose-600 mt-0.5">
              Must be removed from cart before checkout can proceed.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          className="self-end sm:self-auto px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100/70 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          Remove Item
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Provider */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {item.product.providerName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400 capitalize">
              {item.product.type?.replace('_', ' ')}
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 truncate">
            {item.product.title}
          </h4>
        </div>

        {/* Quantity Controls & Line Total */}
        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
            <button
              type="button"
              disabled={localQty <= 1 || isMutating}
              onClick={() => changeQuantity(-1)}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-3 py-1 font-mono text-xs font-bold text-slate-800 min-w-8 text-center bg-white">
              {localQty}
            </span>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => changeQuantity(1)}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Pricing */}
          <div className="text-right min-w-28">
            {effectiveUnitPrice !== null ? (
              <>
                <div className="text-sm font-bold text-slate-900">
                  {currency} {(effectiveUnitPrice * localQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {localQty > 1 && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    {currency} {effectiveUnitPrice.toLocaleString()} each
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
                Select duration
              </span>
            )}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            disabled={isMutating}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Remove item from cart"
            aria-label={`Remove ${item.product.title}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Wellness Duration Selector if required */}
      {item.product.wellnessPricing && item.product.wellnessPricing.length > 0 && (
        <WellnessDurationPicker
          options={item.product.wellnessPricing}
          currency={currency}
          selectedOptionId={item.wellnessPricingId}
          onSelectOption={(optId) => onUpdateWellnessOption(item.id, optId)}
          disabled={isMutating}
        />
      )}
    </div>
  );
}
