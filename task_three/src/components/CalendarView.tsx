'use client';

import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { DayAvailability } from '../types';

interface CalendarViewProps {
  calendar: DayAvailability[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  providerTz: string;
}

export function CalendarView({
  calendar,
  selectedDate,
  onSelectDate,
  providerTz,
}: CalendarViewProps) {
  // Calendar month view state
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // Today at provider
  const todayAtProvider = DateTime.now().setZone(providerTz).startOf('day');
  const activeMonthDate = todayAtProvider.plus({ months: currentMonthOffset });
  const activeMonthStart = activeMonthDate.startOf('month');
  const activeMonthEnd = activeMonthDate.endOf('month');

  // Map calendar items by YYYY-MM-DD
  const availabilityMap = new Map<string, DayAvailability>();
  for (const item of calendar) {
    availabilityMap.set(item.dateString, item);
  }

  // Days in month grid
  const daysInMonth = activeMonthEnd.day;
  // Day of week of 1st day (1 = Monday, 7 = Sunday)
  const firstDayOfWeek = activeMonthStart.weekday; // 1 to 7

  const daysGrid: (string | null)[] = [];
  // Fill empty prefix days
  for (let i = 1; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = activeMonthStart.set({ day: d }).toFormat('yyyy-MM-dd');
    daysGrid.push(dStr);
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {activeMonthDate.toFormat('MMMM yyyy')}
          </h3>
          <p className="text-xs text-slate-500">
            Available dates over next 90 days (Provider Time: {providerTz})
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentMonthOffset <= 0}
            onClick={() => setCurrentMonthOffset((prev) => Math.max(0, prev - 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={currentMonthOffset >= 3} // Max 90 days spans ~3 months
            onClick={() => setCurrentMonthOffset((prev) => prev + 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="Appointment Calendar">
        {daysGrid.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} className="h-16" />;
          }

          const dayNumber = parseInt(dateStr.split('-')[2], 10);
          const avail = availabilityMap.get(dateStr);
          const isSelected = selectedDate === dateStr;

          if (!avail) {
            // Out of 90 days range or past
            return (
              <div
                key={dateStr}
                className="h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-1 flex flex-col justify-between text-slate-300 opacity-40 cursor-not-allowed"
                title="Outside booking window"
              >
                <span className="text-xs font-mono">{dayNumber}</span>
                <span className="text-[9px] text-slate-400">Unavailable</span>
              </div>
            );
          }

          const isUnavailable = avail.isClosed || !avail.hasFreeSlots || avail.isPast;

          let badgeText = '';
          let badgeColor = '';
          if (avail.isPast) {
            badgeText = 'Past';
            badgeColor = 'text-slate-400';
          } else if (avail.isClosed) {
            badgeText = avail.closureReason || 'Closed';
            badgeColor = 'text-rose-600 bg-rose-50';
          } else if (!avail.hasFreeSlots) {
            badgeText = 'No slots';
            badgeColor = 'text-amber-700 bg-amber-50';
          } else {
            badgeText = `${avail.availableSlotCount} free`;
            badgeColor = 'text-emerald-700 font-semibold';
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isUnavailable}
              onClick={() => onSelectDate(dateStr)}
              className={`h-16 rounded-xl p-1.5 flex flex-col justify-between text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm ring-2 ring-teal-300'
                  : isUnavailable
                  ? 'bg-slate-50/70 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  : 'bg-white hover:bg-teal-50/50 hover:border-teal-300 border-slate-200 text-slate-800'
              }`}
              title={
                avail.closureReason
                  ? `Unavailable: ${avail.closureReason}`
                  : !avail.hasFreeSlots
                  ? 'All appointment slots are booked on this day'
                  : `${avail.availableSlotCount} appointment slots open`
              }
              aria-label={`${dateStr}: ${badgeText}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : ''}`}>
                  {dayNumber}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>

              <span
                className={`text-[9px] truncate px-1 py-0.5 rounded leading-tight block ${
                  isSelected ? 'text-teal-100' : badgeColor
                }`}
              >
                {badgeText}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
