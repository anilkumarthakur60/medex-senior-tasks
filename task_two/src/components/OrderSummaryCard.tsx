'use client';

import React from 'react';
import { Order, PaymentMethod } from '../types';

interface OrderSummaryCardProps {
  orders: Order[];
  onRetryOrder?: (groupType: string, paymentMethod: PaymentMethod, idempotencyKey: string) => void;
  isRetrying?: boolean;
}

export function OrderSummaryCard({
  orders,
  onRetryOrder,
  isRetrying = false,
}: OrderSummaryCardProps) {
  if (orders.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Active & Confirmed Orders</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {orders.length}
          </span>
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          Split Checkout Status
        </span>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const isSuccess = order.status === 'paid' || order.status === 'pending';
          const isFailed = order.status === 'failed';

          return (
            <div
              key={order.orderId}
              className={`p-4 rounded-xl border transition-all ${
                isSuccess
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {order.orderId}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {order.status === 'paid'
                        ? 'Confirmed · Paid'
                        : order.status === 'pending'
                        ? 'Confirmed · Pay at Clinic'
                        : 'Payment Failed'}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      ({order.groupType.replace('_', ' ')})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                    Payment: <strong className="capitalize">{order.paymentMethod.replace('_', ' ')}</strong>
                  </p>

                  {isFailed && order.errorMessage && (
                    <p className="text-xs font-medium text-rose-700 mt-1">
                      Reason: {order.errorMessage}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {Object.entries(order.subtotals).map(([curr, amt]) => (
                      <span key={curr} className="font-mono font-bold text-xs text-slate-900">
                        {curr} {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ))}
                  </div>

                  {isFailed && onRetryOrder && (
                    <button
                      type="button"
                      disabled={isRetrying}
                      onClick={() =>
                        onRetryOrder(order.groupType, order.paymentMethod, order.idempotencyKey)
                      }
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {isRetrying ? 'Retrying...' : 'Retry Checkout'}
                    </button>
                  )}
                </div>
              </div>

              {/* Items Breakdown list */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 pl-2">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Ordered Services:
                </span>
                <ul className="text-xs text-slate-700 space-y-0.5 list-disc pl-4">
                  {order.items.map((it) => (
                    <li key={it.id}>
                      {it.quantity}x {it.product.title}{' '}
                      <span className="text-slate-400">({it.product.providerName})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
