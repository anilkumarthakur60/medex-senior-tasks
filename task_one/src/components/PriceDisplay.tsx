import React from 'react';
import { PriceBreakdown } from '../types';
import { formatCurrency } from '../lib/priceCalc';

interface PriceDisplayProps {
  priceInfo: PriceBreakdown;
}

export function PriceDisplay({ priceInfo }: PriceDisplayProps) {
  if (priceInfo.isWellness) {
    if (!priceInfo.finalPrice || priceInfo.finalPrice <= 0) {
      return (
        <div className="text-right">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Options available
          </span>
          <div className="text-sm font-semibold text-slate-700 mt-0.5">
            Duration-based
          </div>
        </div>
      );
    }

    return (
      <div className="text-right">
        <div className="text-xs font-medium text-slate-500">
          From{' '}
          {priceInfo.minPrice && priceInfo.maxPrice && priceInfo.minPrice !== priceInfo.maxPrice
            ? `(${formatCurrency(priceInfo.minPrice, priceInfo.currency)} - ${formatCurrency(
                priceInfo.maxPrice,
                priceInfo.currency
              )})`
            : ''}
        </div>
        <div className="text-base font-bold text-teal-700">
          {formatCurrency(priceInfo.finalPrice, priceInfo.currency)}
        </div>
      </div>
    );
  }

  return (
    <div className="text-right">
      {priceInfo.hasDiscount && (
        <div className="flex items-center justify-end gap-1.5 text-xs">
          <span className="line-through text-slate-400">
            {formatCurrency(priceInfo.originalPrice, priceInfo.currency)}
          </span>
          <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
            -{Math.round((priceInfo.discountAmount / priceInfo.originalPrice) * 100)}%
          </span>
        </div>
      )}
      <div className="text-base font-bold text-slate-900">
        {formatCurrency(priceInfo.finalPrice, priceInfo.currency)}
      </div>
      {priceInfo.hasServiceCharge && (
        <div className="text-[10px] text-slate-500">
          incl. service charge
        </div>
      )}
    </div>
  );
}
