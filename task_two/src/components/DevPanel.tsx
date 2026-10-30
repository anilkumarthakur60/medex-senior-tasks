'use client';

import React, { useState } from 'react';

export type CheckoutSimMode = 'normal' | 'payment_fail' | 'conflict_409' | 'server_500';

interface DevPanelProps {
  delay: number;
  onDelayChange: (d: number) => void;
  checkoutSimMode: CheckoutSimMode;
  onCheckoutSimModeChange: (m: CheckoutSimMode) => void;
  onResetCart: () => void;
  isResetting: boolean;
}

export function DevPanel({
  delay,
  onDelayChange,
  checkoutSimMode,
  onCheckoutSimModeChange,
  onResetCart,
  isResetting,
}: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-700 w-80 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-slate-300">
                Cart & Checkout Dev Panel
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Close dev panel"
            >
              ✕
            </button>
          </div>

          {/* Latency */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium">
              Simulated API Latency: {delay}ms
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[0, 300, 1000, 2500].map((d) => (
                <button
                  key={d}
                  onClick={() => onDelayChange(d)}
                  className={`py-1 px-1.5 rounded font-mono text-[11px] border ${
                    delay === d
                      ? 'bg-teal-600 border-teal-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {d}ms
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Failure Mode */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-medium">
              Next Checkout Result:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'normal', label: '201 Success' },
                { id: 'payment_fail', label: '402 Payment Fail' },
                { id: 'conflict_409', label: '409 Conflict' },
                { id: 'server_500', label: '500 Server Error' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onCheckoutSimModeChange(opt.id as CheckoutSimMode)}
                  className={`py-1.5 px-2 rounded font-semibold text-[11px] border text-left transition-colors ${
                    checkoutSimMode === opt.id
                      ? 'bg-teal-600 border-teal-500 text-white shadow-xs'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Cart to Default JSON state */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={isResetting}
              onClick={onResetCart}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-200 font-semibold transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {isResetting ? 'Resetting...' : 'Reset Cart to Initial Data'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Dev Tools</span>
        </button>
      )}
    </div>
  );
}
