import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import {
  Provider,
  Closure,
  BookedSlot,
  ExistingBooking,
  BookingConfirmation,
  Slot,
  DayAvailability,
} from '../types';
import { normalizeTimezone, dateToDayOffset, dayOffsetToDate } from './timezone';
import {
  generateSpecialistSlots,
  filterSlotsForGroupSize,
  timeToMinutes,
} from './slotEngine';

interface BookingData {
  providers: Provider[];
  closures: Closure[];
  bookedSlots: BookedSlot[];
  existingBooking: ExistingBooking;
}

let providers: Provider[] = [];
let closures: Closure[] = [];
let bookedSlots: BookedSlot[] = [];
let existingBooking: ExistingBooking | null = null;
let confirmedBookings = new Map<string, BookingConfirmation>();

function loadInitialData() {
  const filePath = path.join(process.cwd(), 'data', 'task3-booking.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data: BookingData = JSON.parse(fileContent);

  providers = data.providers;
  closures = data.closures;
  bookedSlots = [...data.bookedSlots];
  existingBooking = { ...data.existingBooking };
  confirmedBookings = new Map();
}

loadInitialData();

export function resetBookingStore() {
  loadInitialData();
}

export function getAllProviders(): Provider[] {
  return providers;
}

export function getProvider(id: number): Provider | undefined {
  return providers.find((p) => p.id === id);
}

export function getExistingBooking(): ExistingBooking | null {
  return existingBooking;
}

/**
 * Computes calendar availability for 90 days from today at the provider.
 */
export function getCalendarAvailability(
  providerId: number,
  specialistId?: string
): DayAvailability[] {
  const provider = getProvider(providerId);
  if (!provider) return [];

  const providerTz = normalizeTimezone(provider.timezone, provider.country);
  const specialist = specialistId
    ? provider.specialists.find((s) => s.id === specialistId) || provider.specialists[0]
    : provider.specialists[0];

  const results: DayAvailability[] = [];

  for (let offset = 0; offset < 90; offset++) {
    const dateString = dayOffsetToDate(offset, providerTz);

    // 1. Check closures
    const closure = closures.find(
      (c) => c.providerId === providerId && c.dayOffset === offset
    );

    // 2. Compute slots for this day
    const bookedTimesSet = new Set<string>();
    for (const b of bookedSlots) {
      if (
        b.providerId === providerId &&
        b.dayOffset === offset &&
        (!specialist || b.specialistId === specialist.id)
      ) {
        bookedTimesSet.add(b.startTime);
      }
    }

    const { slots, isProviderClosed } = specialist
      ? generateSpecialistSlots(
          provider,
          specialist,
          dateString,
          offset,
          bookedTimesSet,
          providerTz
        )
      : { slots: [], isProviderClosed: false };

    const freeSlots = slots.filter((s) => !s.isBooked && !s.isPast);

    results.push({
      dateString,
      dayOffset: offset,
      isPast: offset < 0,
      isClosed: isProviderClosed || Boolean(closure),
      closureReason: closure ? closure.reason : isProviderClosed ? 'Closed' : undefined,
      hasFreeSlots: freeSlots.length > 0,
      availableSlotCount: freeSlots.length,
    });
  }

  return results;
}

/**
 * Retrieves all slots for a specialist on a date, filtered by group size.
 */
export function getSlotsForDate(
  providerId: number,
  specialistId: string,
  dateString: string,
  numberOfPeople = 1
): {
  slots: Slot[];
  scheduleOverlapNote?: string;
  isProviderClosed: boolean;
  closureReason?: string;
} {
  const provider = getProvider(providerId);
  if (!provider) {
    return { slots: [], isProviderClosed: true };
  }

  const specialist = provider.specialists.find((s) => s.id === specialistId);
  if (!specialist) {
    return { slots: [], isProviderClosed: true };
  }

  const providerTz = normalizeTimezone(provider.timezone, provider.country);
  const offset = dateToDayOffset(dateString, providerTz);

  // Check closure
  const closure = closures.find(
    (c) => c.providerId === providerId && c.dayOffset === offset
  );
  if (closure) {
    return {
      slots: [],
      isProviderClosed: true,
      closureReason: closure.reason,
    };
  }

  // Booked slots set
  const bookedTimesSet = new Set<string>();
  for (const b of bookedSlots) {
    if (
      b.providerId === providerId &&
      b.specialistId === specialistId &&
      b.dayOffset === offset
    ) {
      bookedTimesSet.add(b.startTime);
    }
  }

  const generated = generateSpecialistSlots(
    provider,
    specialist,
    dateString,
    offset,
    bookedTimesSet,
    providerTz
  );

  const groupFilteredSlots = filterSlotsForGroupSize(
    generated.slots,
    numberOfPeople
  );

  return {
    slots: groupFilteredSlots,
    scheduleOverlapNote: generated.scheduleOverlapNote,
    isProviderClosed: generated.isProviderClosed,
  };
}

/**
 * Creates a new booking.
 * Returns 409 conflict if slot is already booked or conflict simulated.
 */
export function bookAppointment(
  providerId: number,
  specialistId: string,
  dateString: string,
  startTime: string,
  numberOfPeople: number,
  simulateConflict = false
): {
  success: boolean;
  booking?: BookingConfirmation;
  conflict?: boolean;
  error?: string;
} {
  const provider = getProvider(providerId);
  if (!provider) return { success: false, error: 'Provider not found' };

  const specialist = provider.specialists.find((s) => s.id === specialistId);
  if (!specialist) return { success: false, error: 'Specialist not found' };

  const providerTz = normalizeTimezone(provider.timezone, provider.country);
  const dayOffset = dateToDayOffset(dateString, providerTz);

  if (simulateConflict) {
    return {
      success: false,
      conflict: true,
      error: 'This slot was just booked by another patient.',
    };
  }

  // Check if slot is already in bookedSlots
  const isAlreadyBooked = bookedSlots.some(
    (b) =>
      b.providerId === providerId &&
      b.specialistId === specialistId &&
      b.dayOffset === dayOffset &&
      b.startTime === startTime
  );

  if (isAlreadyBooked) {
    return {
      success: false,
      conflict: true,
      error: 'This slot was just booked by another patient.',
    };
  }

  // Reserve consecutive slots for N people
  const duration = specialist.consultation.durationInMinutes;
  const buffer = specialist.consultation.bufferInMinutes;
  const interval = duration + buffer;

  const startMinutes = timeToMinutes(startTime);

  for (let i = 0; i < numberOfPeople; i++) {
    const slotMinutes = startMinutes + i * interval;
    const h = Math.floor(slotMinutes / 60);
    const m = slotMinutes % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    bookedSlots.push({
      providerId,
      specialistId,
      dayOffset,
      startTime: timeStr,
    });
  }

  const totalDuration = numberOfPeople * duration + (numberOfPeople - 1) * buffer;
  const endMinutes = startMinutes + totalDuration;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const bookingId = `BK-${DateTime.now().toFormat('yyyyMMdd')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const confirmation: BookingConfirmation = {
    bookingId,
    providerId,
    specialistId,
    date: dateString,
    startTime,
    endTime: endTimeStr,
    numberOfPeople,
    providerTimezone: providerTz,
    createdAt: DateTime.now().toISO()!,
  };

  confirmedBookings.set(bookingId, confirmation);

  return { success: true, booking: confirmation };
}

/**
 * Reschedules an existing booking.
 */
export function rescheduleAppointment(
  bookingId: string,
  newDateString: string,
  newStartTime: string,
  simulateConflict = false
): {
  success: boolean;
  booking?: BookingConfirmation;
  conflict?: boolean;
  error?: string;
} {
  if (simulateConflict) {
    return {
      success: false,
      conflict: true,
      error: 'The requested slot was taken before confirmation.',
    };
  }

  let providerId = 48;
  let specialistId = '2a2f07eb-7886-4f83-82ab-ca56f415da44';
  let numberOfPeople = 1;

  if (existingBooking && existingBooking.bookingId === bookingId) {
    providerId = existingBooking.providerId;
    specialistId = existingBooking.specialistId;
    numberOfPeople = existingBooking.numberOfPeople;
  } else if (confirmedBookings.has(bookingId)) {
    const prev = confirmedBookings.get(bookingId)!;
    providerId = prev.providerId;
    specialistId = prev.specialistId;
    numberOfPeople = prev.numberOfPeople;
  }

  const result = bookAppointment(
    providerId,
    specialistId,
    newDateString,
    newStartTime,
    numberOfPeople,
    false
  );

  if (result.success && result.booking) {
    result.booking.bookingId = bookingId; // Preserve original booking ID
    confirmedBookings.set(bookingId, result.booking);
  }

  return result;
}
