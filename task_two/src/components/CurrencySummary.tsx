import React from 'react';
import { Cart } from '../types';

interface CurrencySummaryProps {
  cart: Cart;
  onCheckoutAll: () => void;
  isCheckingOut: boolean;
  canCheckoutAny: boolean;
}

export function CurrencySummary({
  cart,
  onCheckoutAll,
  isCheckingOut,
  canCheckoutAny,
}: CurrencySummaryProps) {
  // Aggregate subtotals by currency across ALL priced items
  const currencyTotals: Record<string, number> = {};

  for (const group of cart.groups) {
    for (const [curr, subtotal] of Object.entries(group.subtotals)) {
      currencyTotals[curr] = (currencyTotals[curr] || 0) + subtotal;
    }
  }

  const currencies = Object.keys(currencyTotals);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Payment Breakdown</h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {cart.totalItems} Items
        </span>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">
            Why separate currency totals?
          </p>
          <p>
            MedEx routes payments directly to healthcare providers in their native local currencies. To protect you from hidden markups or inaccurate exchange rates, amounts are charged separately.
          </p>
        </div>

        {/* Currency Totals List */}
        <div className="space-y-2 pt-1">
          {currencies.length > 0 ? (
            currencies.map((currency) => (
              <div
                key={currency}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-sm font-bold text-slate-800">
                    Total in {currency}
                  </span>
                </div>
                <span className="text-base font-bold font-mono text-teal-800">
                  {currency}{' '}
                  {currencyTotals[currency].toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">
              No priced items in cart yet
            </p>
          )}
        </div>
      </div>

      {/* Checkout All Groups Button */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          disabled={!canCheckoutAny || isCheckingOut}
          onClick={onCheckoutAll}
          className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isCheckingOut ? (
            <>
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing Split Checkout...</span>
            </>
          ) : (
            <span>Checkout All Groups</span>
          )}
        </button>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          Each service group generates its own confirmed order with idempotency protection.
        </p>
      </div>
    </div>
  );
}
