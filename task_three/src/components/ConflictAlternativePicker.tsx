'use client';

import React from 'react';
import { Slot } from '../types';

interface ConflictAlternativePickerProps {
  conflictedTime: string;
  alternativeSlots: Slot[];
  onSelectAlternative: (time: string) => void;
  onDismiss: () => void;
}

export function ConflictAlternativePicker({
  conflictedTime,
  alternativeSlots,
  onSelectAlternative,
  onDismiss,
}: ConflictAlternativePickerProps) {
  return (
    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
            !
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Someone else just booked the {conflictedTime} slot!
            </h4>
            <p className="text-xs text-amber-900 mt-0.5">
              Don&apos;t worry - we kept your specialist and date selection. Here are the closest available times right now:
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-700 hover:text-amber-950 text-xs font-semibold"
        >
          ✕ Dismiss
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {alternativeSlots.map((slot) => (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onSelectAlternative(slot.startTime)}
            className="p-2.5 rounded-xl bg-white border border-amber-300 hover:border-teal-500 hover:bg-teal-50 text-center font-mono font-bold text-xs text-slate-800 shadow-2xs transition-all cursor-pointer"
          >
            <div className="text-sm text-teal-800">{slot.startTime}</div>
            <div className="text-[10px] text-slate-500 font-normal">to {slot.endTime}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
