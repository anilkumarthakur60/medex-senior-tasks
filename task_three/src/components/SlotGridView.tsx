'use client';

import React from 'react';
import { Slot } from '../types';
import { groupSlotsByPeriod } from '../lib/slotEngine';

interface SlotGridViewProps {
  slots: Slot[];
  selectedSlotTime: string | null;
  onSelectSlot: (startTime: string) => void;
  numberOfPeople: number;
  scheduleOverlapNote?: string;
  isProviderClosed?: boolean;
  closureReason?: string;
}

export function SlotGridView({
  slots,
  selectedSlotTime,
  onSelectSlot,
  numberOfPeople,
  scheduleOverlapNote,
  isProviderClosed,
  closureReason,
}: SlotGridViewProps) {
  if (isProviderClosed) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
        <span className="text-2xl">🏥</span>
        <h4 className="text-base font-bold text-slate-800">
          Provider is Closed on this Day
        </h4>
        <p className="text-xs text-slate-500">
          {closureReason
            ? `Special Closure: ${closureReason}`
            : 'This healthcare facility is not open on the selected day of the week.'}
        </p>
        <p className="text-xs text-teal-700 font-semibold pt-1">
          Please pick another date from the calendar.
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
        <h4 className="text-base font-bold text-slate-800">
          No Slots Generated for this Specialist
        </h4>
        <p className="text-xs text-slate-500">
          The specialist does not have consultation hours that overlap with the facility on this day.
        </p>
      </div>
    );
  }

  const slotGroups = groupSlotsByPeriod(slots);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Available Appointment Slots
          </h3>
          <p className="text-xs text-slate-500">
            {numberOfPeople > 1
              ? `Filtered for ${numberOfPeople} people (requires ${numberOfPeople} consecutive open slots)`
              : 'Select your preferred appointment start time'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-teal-500 bg-white" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            Booked / Passed
          </span>
        </div>
      </div>

      {/* Schedule Overlap Note if specialist hours exceed provider hours */}
      {scheduleOverlapNote && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
          <span className="text-amber-600 font-bold">ℹ</span>
          <span>{scheduleOverlapNote}</span>
        </div>
      )}

      {/* Slots grouped by Morning, Afternoon, Evening */}
      <div className="space-y-4">
        {slotGroups.map((group) => (
          <div key={group.period} className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <span>{group.period}</span>
              <span className="h-px bg-slate-100 flex-1" />
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {group.slots.map((slot) => {
                const isSelected = selectedSlotTime === slot.startTime;
                const isUnavailable = slot.isBooked || slot.isPast;

                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => onSelectSlot(slot.startTime)}
                    className={`py-2 px-2.5 rounded-xl text-center border font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-xs ring-2 ring-teal-300'
                        : isUnavailable
                        ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                        : 'bg-white hover:bg-teal-50 hover:border-teal-300 border-slate-200 text-slate-800'
                    }`}
                    title={
                      slot.isPast
                        ? 'Time has already passed today'
                        : slot.isBooked
                        ? numberOfPeople > 1
                          ? `Cannot fit ${numberOfPeople} consecutive slots here`
                          : 'Slot already booked'
                        : `Slot: ${slot.startTime} - ${slot.endTime}`
                    }
                  >
                    <div className="text-xs font-bold leading-tight">
                      {slot.startTime}
                    </div>
                    <div className="text-[10px] opacity-70">
                      {slot.isPast
                        ? 'Passed'
                        : slot.isBooked
                        ? 'Booked'
                        : `to ${slot.endTime}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
