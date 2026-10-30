'use client';

import React from 'react';
import { formatDualTime } from '../lib/timezone';

interface DualClockBannerProps {
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  providerName: string;
  providerTz: string;
  customerTz: string;
}

export function DualClockBanner({
  selectedDate,
  selectedTime,
  providerName,
  providerTz,
  customerTz,
}: DualClockBannerProps) {
  const dual = formatDualTime(selectedDate, selectedTime, providerTz, customerTz);

  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-teal-50/50 to-white p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-teal-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
            Confirmed Appointment Timing (Two Clocks)
          </h4>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Cross-border travel safe
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock 1: Provider Time (Where the customer must physically be!) */}
        <div className="p-4 rounded-xl bg-white border border-teal-300/80 shadow-xs space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wide">
              1. Provider Local Time (On-Site)
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {providerTz}
            </span>
          </div>

          <div className="pt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-slate-900">
              {dual.providerTime}
            </div>
            <div className="text-xs font-semibold text-slate-600 text-right">
              {dual.providerDate}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            Wall-clock time at <strong className="text-slate-700">{providerName}</strong>. You must arrive before this time.
          </p>
        </div>

        {/* Clock 2: Customer Local Time (Where the customer lives right now) */}
        <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-xs space-y-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">
              2. Your Local Time (Your Device)
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {customerTz}
            </span>
          </div>

          <div className="pt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black font-mono text-indigo-950">
              {dual.customerTime}
            </div>
            <div className="text-xs font-semibold text-slate-600 text-right">
              {dual.customerDate}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            {dual.isDifferentDay ? (
              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Note: {dual.dayDifferenceDesc}
              </span>
            ) : (
              <span>Matches your calendar for flight & travel planning.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
