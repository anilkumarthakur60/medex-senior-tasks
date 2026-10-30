'use client';

import React from 'react';
import { ExistingBooking } from '../types';

interface RescheduleBannerProps {
  existingBooking: ExistingBooking;
  isRescheduleMode: boolean;
  onToggleRescheduleMode: (enabled: boolean) => void;
  oldDateStr: string;
  providerTz: string;
}

export function RescheduleBanner({
  existingBooking,
  isRescheduleMode,
  onToggleRescheduleMode,
  oldDateStr,
  providerTz,
}: RescheduleBannerProps) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isRescheduleMode
          ? 'bg-blue-50/90 border-blue-300 shadow-xs'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Existing Appointment on File
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                {existingBooking.bookingId}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              Scheduled for <strong>{oldDateStr}</strong> at <strong className="font-mono">{existingBooking.startTime}</strong> ({providerTz})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleRescheduleMode(!isRescheduleMode)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            isRescheduleMode
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
          }`}
        >
          {isRescheduleMode ? 'Cancel Reschedule' : 'Reschedule This Appointment'}
        </button>
      </div>
    </div>
  );
}
