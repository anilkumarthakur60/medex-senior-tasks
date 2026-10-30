'use client';

import React, { useState } from 'react';
import { Provider } from '../types';

interface DevPanelProps {
  providers: Provider[];
  activeProviderId: number;
  onSelectProvider: (id: number) => void;
  customerTz: string;
  onChangeCustomerTz: (tz: string) => void;
  simulatedConflict: boolean;
  onToggleConflict: (val: boolean) => void;
  simulatedFail: boolean;
  onToggleFail: (val: boolean) => void;
  onResetStore: () => void;
}

const COMMON_CUSTOMER_TIMEZONES = [
  { id: 'Asia/Kathmandu', label: 'Kathmandu (UTC+5:45)' },
  { id: 'Asia/Bangkok', label: 'Bangkok (UTC+7:00)' },
  { id: 'Asia/Kolkata', label: 'New Delhi / Kolkata (UTC+5:30)' },
  { id: 'Europe/London', label: 'London (UTC+0 / BST+1)' },
  { id: 'America/New_York', label: 'New York (EDT/EST)' },
];

export function DevPanel({
  providers,
  activeProviderId,
  onSelectProvider,
  customerTz,
  onChangeCustomerTz,
  simulatedConflict,
  onToggleConflict,
  simulatedFail,
  onToggleFail,
  onResetStore,
}: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-700 w-84 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-slate-300">
                Timezone & Slot Dev Panel
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          {/* Provider Switcher */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium block">
              Switch Healthcare Facility:
            </label>
            <select
              value={activeProviderId}
              onChange={(e) => onSelectProvider(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} {p.name} ({p.country}) [Tz: {p.timezone || 'empty'}]
                </option>
              ))}
            </select>
          </div>

          {/* Customer Local Timezone Switcher */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium block">
              Simulate Customer Timezone:
            </label>
            <select
              value={customerTz}
              onChange={(e) => onChangeCustomerTz(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs"
            >
              {COMMON_CUSTOMER_TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fault Injections */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">Force 409 Slot Conflict</span>
              <input
                type="checkbox"
                checked={simulatedConflict}
                onChange={(e) => onToggleConflict(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300 font-medium">Force 500 API Failure</span>
              <input
                type="checkbox"
                checked={simulatedFail}
                onChange={(e) => onToggleFail(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onResetStore}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Reset Booking Store to Default
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-slate-200 hover:text-white px-3 py-2 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold backdrop-blur-xs transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Dev Tools (Timezones)</span>
        </button>
      )}
    </div>
  );
}
