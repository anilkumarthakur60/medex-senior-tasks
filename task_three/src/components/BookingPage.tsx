'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import {
  Provider,
  Slot,
  DayAvailability,
  ExistingBooking,
  BookingConfirmation,
} from '../types';
import { normalizeTimezone, dayOffsetToDate } from '../lib/timezone';
import { findClosestAlternativeSlots } from '../lib/slotEngine';

import { DualClockBanner } from './DualClockBanner';
import { CalendarView } from './CalendarView';
import { SlotGridView } from './SlotGridView';
import { SpecialistPicker } from './SpecialistPicker';
import { GroupBookingPicker } from './GroupBookingPicker';
import { RescheduleBanner } from './RescheduleBanner';
import { ConfirmationModal } from './ConfirmationModal';
import { ConflictAlternativePicker } from './ConflictAlternativePicker';
import { CalendarSkeleton, SlotsSkeleton } from './Skeleton';
import { DevPanel } from './DevPanel';

export function BookingPage() {
  // Active Provider selection
  const [activeProviderId, setActiveProviderId] = useState<number>(48); // Default: Riverside TH
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return DateTime.now().setZone('Asia/Bangkok').plus({ days: 1 }).toFormat('yyyy-MM-dd');
  });
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);

  // Customer timezone (default to Kathmandu for the story: "I live in Kathmandu. I'm booking in Bangkok")
  const [customerTz, setCustomerTz] = useState<string>('Asia/Kathmandu');

  // Reschedule state
  const [isRescheduleMode, setIsRescheduleMode] = useState<boolean>(false);

  // Modal & Conflict states
  const [confirmedBooking, setConfirmedBooking] = useState<BookingConfirmation | null>(null);
  const [conflictedSlotTime, setConflictedSlotTime] = useState<string | null>(null);
  const [conflictAlternatives, setConflictAlternatives] = useState<Slot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fault simulation
  const [simulatedConflict, setSimulatedConflict] = useState<boolean>(false);
  const [simulatedFail, setSimulatedFail] = useState<boolean>(false);

  // Fetch all providers list
  const providersQuery = useQuery<{ providers: Provider[] }>({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await fetch('/api/providers/all');
      return res.json();
    },
  });

  const providers = providersQuery.data?.providers || [];
  const activeProvider = providers.find((p) => p.id === activeProviderId) || providers[0];

  // Normalized provider timezone
  const providerTz = activeProvider
    ? normalizeTimezone(activeProvider.timezone, activeProvider.country)
    : 'Asia/Bangkok';

  // Derived effective specialist ID
  const effectiveSpecialistId =
    selectedSpecialistId && activeProvider?.specialists.some((s) => s.id === selectedSpecialistId)
      ? selectedSpecialistId
      : activeProvider?.specialists[0]?.id || '';

  // Fetch slots and 90-day calendar availability
  const slotsQuery = useQuery<{
    calendar: DayAvailability[];
    slots: Slot[];
    scheduleOverlapNote?: string;
    isProviderClosed: boolean;
    closureReason?: string;
    existingBooking?: ExistingBooking;
  }>({
    queryKey: [
      'slots',
      activeProviderId,
      effectiveSpecialistId,
      selectedDate,
      numberOfPeople,
      simulatedFail,
    ],
    queryFn: async () => {
      const url = `/api/providers/${activeProviderId}/slots?date=${selectedDate}&specialistId=${effectiveSpecialistId}&numberOfPeople=${numberOfPeople}&fail=${
        simulatedFail ? 1 : 0
      }`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load slots');
      return res.json();
    },
    enabled: Boolean(activeProviderId && effectiveSpecialistId && selectedDate),
  });

  const calendar = slotsQuery.data?.calendar || [];
  const slots = slotsQuery.data?.slots || [];
  const scheduleOverlapNote = slotsQuery.data?.scheduleOverlapNote;
  const isProviderClosed = slotsQuery.data?.isProviderClosed;
  const closureReason = slotsQuery.data?.closureReason;
  const existingBooking = slotsQuery.data?.existingBooking;

  const currentSpecialist = activeProvider?.specialists.find(
    (s) => s.id === effectiveSpecialistId
  );

  // Existing booking date string
  const existingBookingDateStr = existingBooking
    ? dayOffsetToDate(existingBooking.dayOffset, providerTz)
    : '';

  // Confirm booking or reschedule
  const handleConfirm = async () => {
    if (!selectedSlotTime || !selectedDate || !currentSpecialist) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setConflictedSlotTime(null);

    try {
      if (isRescheduleMode && existingBooking) {
        // PUT /api/bookings/:id
        const res = await fetch(
          `/api/bookings/${existingBooking.bookingId}?conflict=${simulatedConflict ? 1 : 0}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: selectedDate,
              startTime: selectedSlotTime,
            }),
          }
        );

        const data = await res.json();
        if (res.status === 409) {
          // 409 Conflict handling
          const alternatives = findClosestAlternativeSlots(slots, selectedSlotTime);
          setConflictedSlotTime(selectedSlotTime);
          setConflictAlternatives(alternatives);
          slotsQuery.refetch();
          return;
        }

        if (!res.ok) throw new Error(data.error || 'Reschedule failed');

        setConfirmedBooking(data.booking);
        slotsQuery.refetch();
      } else {
        // POST /api/bookings
        const res = await fetch(
          `/api/bookings?conflict=${simulatedConflict ? 1 : 0}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerId: activeProviderId,
              specialistId: effectiveSpecialistId,
              date: selectedDate,
              startTime: selectedSlotTime,
              numberOfPeople,
            }),
          }
        );

        const data = await res.json();
        if (res.status === 409) {
          // 409 Conflict handling
          const alternatives = findClosestAlternativeSlots(slots, selectedSlotTime);
          setConflictedSlotTime(selectedSlotTime);
          setConflictAlternatives(alternatives);
          slotsQuery.refetch();
          return;
        }

        if (!res.ok) throw new Error(data.error || 'Booking failed');

        setConfirmedBooking(data.booking);
        slotsQuery.refetch();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during booking';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAlternative = (time: string) => {
    setSelectedSlotTime(time);
    setConflictedSlotTime(null);
  };

  const handleResetStore = async () => {
    await fetch('/api/dev/reset', { method: 'POST' });
    slotsQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-sm">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                MedEx <span className="text-teal-600">Cross-Timezone Booking</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Coordinated scheduling between patient and facility timezones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hidden sm:inline">
              Your Time: <strong>{customerTz}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Existing Booking Reschedule Banner */}
        {existingBooking && (
          <RescheduleBanner
            existingBooking={existingBooking}
            isRescheduleMode={isRescheduleMode}
            onToggleRescheduleMode={setIsRescheduleMode}
            oldDateStr={existingBookingDateStr}
            providerTz={providerTz}
          />
        )}

        {/* 409 Conflict Alert with Alternatives */}
        {conflictedSlotTime && (
          <ConflictAlternativePicker
            conflictedTime={conflictedSlotTime}
            alternativeSlots={conflictAlternatives}
            onSelectAlternative={handleSelectAlternative}
            onDismiss={() => setConflictedSlotTime(null)}
          />
        )}

        {/* Facility Header Info */}
        {activeProvider && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeProvider.name}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {activeProvider.country}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Facility Timezone: <strong className="font-mono text-slate-700">{providerTz}</strong> (from raw: &quot;{activeProvider.timezone || 'empty'}&quot;)
              </p>
            </div>

            <div className="text-xs text-slate-600">
              Booking window: <strong className="text-slate-800">Next 90 Days</strong>
            </div>
          </div>
        )}

        {/* Specialist Selection */}
        {activeProvider && (
          <SpecialistPicker
            specialists={activeProvider.specialists}
            selectedSpecialistId={effectiveSpecialistId}
            onSelectSpecialist={(id) => {
              setSelectedSpecialistId(id);
              setSelectedSlotTime(null);
            }}
          />
        )}

        {/* Group Booking Selector (if not rescheduling) */}
        {!isRescheduleMode && (
          <GroupBookingPicker
            numberOfPeople={numberOfPeople}
            onChangeNumberOfPeople={(count) => {
              setNumberOfPeople(count);
              setSelectedSlotTime(null);
            }}
          />
        )}

        {/* Calendar and Slots Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Calendar View */}
          {slotsQuery.isLoading ? (
            <CalendarSkeleton />
          ) : (
            <CalendarView
              calendar={calendar}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                setSelectedDate(d);
                setSelectedSlotTime(null);
                setConflictedSlotTime(null);
              }}
              providerTz={providerTz}
            />
          )}

          {/* Slots Grid */}
          <div className="space-y-4">
            {slotsQuery.isLoading ? (
              <SlotsSkeleton />
            ) : (
              <SlotGridView
                slots={slots}
                selectedSlotTime={selectedSlotTime}
                onSelectSlot={(time) => {
                  setSelectedSlotTime(time);
                  setConflictedSlotTime(null);
                }}
                numberOfPeople={numberOfPeople}
                scheduleOverlapNote={scheduleOverlapNote}
                isProviderClosed={isProviderClosed}
                closureReason={closureReason}
              />
            )}

            {/* Dual Clock Banner when slot is selected */}
            {selectedSlotTime && selectedDate && activeProvider && (
              <DualClockBanner
                selectedDate={selectedDate}
                selectedTime={selectedSlotTime}
                providerName={activeProvider.name}
                providerTz={providerTz}
                customerTz={customerTz}
              />
            )}

            {/* Booking Confirmation Action Button */}
            {selectedSlotTime && selectedDate && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                {submitError && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium">
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>
                        {isRescheduleMode ? 'Confirming Reschedule...' : 'Confirming Booking...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {isRescheduleMode
                        ? `Confirm Reschedule to ${selectedSlotTime}`
                        : `Confirm Appointment at ${selectedSlotTime} (${activeProvider?.name})`}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmedBooking && activeProvider && currentSpecialist && (
        <ConfirmationModal
          confirmation={confirmedBooking}
          providerName={activeProvider.name}
          specialistName={currentSpecialist.name}
          customerTz={customerTz}
          isReschedule={isRescheduleMode}
          oldDetails={
            existingBooking
              ? { date: existingBookingDateStr, time: existingBooking.startTime }
              : undefined
          }
          onClose={() => setConfirmedBooking(null)}
        />
      )}

      {/* Timezone Dev Panel */}
      <DevPanel
        providers={providers}
        activeProviderId={activeProviderId}
        onSelectProvider={(id) => {
          setActiveProviderId(id);
          setSelectedSlotTime(null);
        }}
        customerTz={customerTz}
        onChangeCustomerTz={setCustomerTz}
        simulatedConflict={simulatedConflict}
        onToggleConflict={setSimulatedConflict}
        simulatedFail={simulatedFail}
        onToggleFail={setSimulatedFail}
        onResetStore={handleResetStore}
      />
    </div>
  );
}
