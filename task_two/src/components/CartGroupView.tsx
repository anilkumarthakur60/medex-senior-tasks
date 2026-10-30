'use client';

import React, { useState } from 'react';
import { CartGroup, PaymentMethod, GroupCheckoutState } from '../types';
import { canGroupCheckout } from '../lib/cartCalculations';
import { CartItemRow } from './CartItemRow';

interface CartGroupViewProps {
  group: CartGroup;
  onUpdateQuantity: (lineId: string, quantity: number) => Promise<boolean>;
  onUpdateWellnessOption: (lineId: string, optionId: string) => void;
  onRemoveItem: (lineId: string) => void;
  onCheckoutGroup: (groupType: string, paymentMethod: PaymentMethod) => Promise<boolean | void>;
  checkoutState?: GroupCheckoutState;
  isGlobalCheckingOut: boolean;
}

const GROUP_TITLES: Record<string, string> = {
  package: 'Health Packages',
  lab_test: 'Laboratory Tests & Panels',
  wellness: 'Wellness & Spa Treatments',
  service: 'Clinical Services',
  insurance: 'Health Insurance Plans',
  unknown: 'Uncategorized Items',
};

export function CartGroupView({
  group,
  onUpdateQuantity,
  onUpdateWellnessOption,
  onRemoveItem,
  onCheckoutGroup,
  checkoutState = { status: 'idle' },
  isGlobalCheckingOut,
}: CartGroupViewProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const validation = canGroupCheckout(group);
  const isSubmitting = checkoutState.status === 'submitting';

  const groupTitle = GROUP_TITLES[group.type] || `${group.type.toUpperCase()} Group`;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Group Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-teal-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900">{groupTitle}</h3>
            <p className="text-xs text-slate-500">
              {group.itemCount} {group.itemCount === 1 ? 'item' : 'items'} in this group
            </p>
          </div>
        </div>

        {/* Subtotals per currency for this group */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Group Subtotal
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {Object.keys(group.subtotals).length > 0 ? (
                Object.entries(group.subtotals).map(([currency, amount]) => (
                  <span
                    key={currency}
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ))
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">
                  Select duration to view total
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-5 space-y-3">
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateWellnessOption={onUpdateWellnessOption}
            onRemoveItem={onRemoveItem}
            isMutating={isSubmitting || isGlobalCheckingOut}
          />
        ))}

        {/* Validation Error Notice if any */}
        {!validation.allowed && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 flex items-center gap-2 text-xs text-amber-800">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{validation.reason}</span>
          </div>
        )}

        {/* Checkout Failure State */}
        {checkoutState.status === 'failed' && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Checkout failed: {checkoutState.error}</span>
            </div>
            <button
              type="button"
              onClick={() => onCheckoutGroup(group.type, selectedPaymentMethod)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Group Checkout Footer */}
      <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Payment Method Selector for this group */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Payment:</span>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
            <button
              type="button"
              disabled={isSubmitting || isGlobalCheckingOut}
              onClick={() => setSelectedPaymentMethod('card')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedPaymentMethod === 'card'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Card (Online)
            </button>
            <button
              type="button"
              disabled={isSubmitting || isGlobalCheckingOut}
              onClick={() => setSelectedPaymentMethod('pay_at_clinic')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                selectedPaymentMethod === 'pay_at_clinic'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pay at Clinic
            </button>
          </div>
        </div>

        {/* Individual Checkout Button */}
        <div>
          <button
            type="button"
            disabled={!validation.allowed || isSubmitting || isGlobalCheckingOut}
            onClick={() => onCheckoutGroup(group.type, selectedPaymentMethod)}
            className="w-full md:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Order...</span>
              </>
            ) : (
              <span>Checkout {groupTitle}</span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
