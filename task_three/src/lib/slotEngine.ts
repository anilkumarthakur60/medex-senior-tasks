import { DateTime } from 'luxon';
import {
  Provider,
  Specialist,
  Slot,
  DayOfWeek,
  SlotGroup,
} from '../types';

/**
 * Parses "HH:mm" into minutes from start of day (0..1439).
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Formats minutes from start of day into "HH:mm".
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generates all potential slots for a specialist on a given date,
 * constrained by provider opening hours, specialist consultation hours,
 * existing booked slots, and current time at provider (if date is today).
 */
export function generateSpecialistSlots(
  provider: Provider,
  specialist: Specialist,
  dateString: string, // YYYY-MM-DD
  dayOffset: number,
  bookedTimesSet: Set<string>, // Set of "HH:mm" booked for this provider, specialist, dayOffset
  providerTz: string,
  nowProviderTime?: DateTime // Current time at provider
): {
  slots: Slot[];
  scheduleOverlapNote?: string;
  isProviderClosed: boolean;
} {
  // Determine day of week
  const dt = DateTime.fromISO(dateString, { zone: providerTz });
  const dayName = dt.toFormat('cccc').toLowerCase() as DayOfWeek;

  const daySchedule = provider.daySchedules[dayName];
  if (!daySchedule) {
    return { slots: [], isProviderClosed: true };
  }

  const providerOpenMinutes = timeToMinutes(daySchedule.startTime);
  const providerCloseMinutes = timeToMinutes(daySchedule.endTime);

  const consultStartMinutes = timeToMinutes(specialist.consultation.startTime);
  const consultEndMinutes = timeToMinutes(specialist.consultation.endTime);

  const duration = specialist.consultation.durationInMinutes;
  const buffer = specialist.consultation.bufferInMinutes;
  const interval = duration + buffer;

  // Overlap explanation if consultation hours fall outside provider hours
  let scheduleOverlapNote: string | undefined;
  if (
    consultStartMinutes < providerOpenMinutes ||
    consultEndMinutes > providerCloseMinutes
  ) {
    scheduleOverlapNote = `${specialist.name}'s advertised hours (${specialist.consultation.startTime} to ${specialist.consultation.endTime}) are limited by ${provider.name}'s opening hours on ${dayName}s (${daySchedule.startTime} to ${daySchedule.endTime}).`;
  }

  // Current clock at provider to check if past
  const currentProviderTime = nowProviderTime || DateTime.now().setZone(providerTz);
  const isTodayAtProvider = dt.hasSame(currentProviderTime, 'day');
  const currentMinutesAtProvider = currentProviderTime.hour * 60 + currentProviderTime.minute;

  const slots: Slot[] = [];

  // Generate slots starting from consultStartMinutes, stepping by interval
  let currentStart = consultStartMinutes;

  while (currentStart + duration <= consultEndMinutes) {
    const currentEnd = currentStart + duration;

    // Rule: Slot is offered ONLY if it lies entirely within the provider's opening hours that day
    const withinProviderHours =
      currentStart >= providerOpenMinutes && currentEnd <= providerCloseMinutes;

    if (withinProviderHours) {
      const startTimeStr = minutesToTime(currentStart);
      const endTimeStr = minutesToTime(currentEnd);

      const isBooked = bookedTimesSet.has(startTimeStr);
      const isPast = isTodayAtProvider && currentStart <= currentMinutesAtProvider;

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        isBooked,
        isPast,
        specialistId: specialist.id,
        providerId: provider.id,
        durationMinutes: duration,
      });
    }

    currentStart += interval;
  }

  return {
    slots,
    scheduleOverlapNote,
    isProviderClosed: false,
  };
}

/**
 * Filter slots for group booking of N people.
 * Rule: Booking for N people requires N consecutive free slots with the same specialist.
 * A slot S[i] is eligible as start time if S[i] ... S[i+N-1] all exist, are free, and un-past.
 */
export function filterSlotsForGroupSize(slots: Slot[], numberOfPeople: number): Slot[] {
  if (numberOfPeople <= 1) {
    return slots;
  }

  return slots.map((slot, index) => {
    // If slot itself is booked or past, it cannot be a start time
    if (slot.isBooked || slot.isPast) {
      return slot;
    }

    // Check if subsequent N-1 consecutive slots are also free
    let canFitGroup = true;
    for (let offset = 0; offset < numberOfPeople; offset++) {
      const nextSlot = slots[index + offset];
      if (!nextSlot || nextSlot.isBooked || nextSlot.isPast) {
        canFitGroup = false;
        break;
      }
    }

    if (!canFitGroup) {
      // Mark as unavailable for group
      return {
        ...slot,
        isBooked: true, // Not available for this group size
      };
    }

    return slot;
  });
}

/**
 * Groups slots into Morning, Afternoon, and Evening.
 */
export function groupSlotsByPeriod(slots: Slot[]): SlotGroup[] {
  const morning: Slot[] = [];
  const afternoon: Slot[] = [];
  const evening: Slot[] = [];

  for (const s of slots) {
    const minutes = timeToMinutes(s.startTime);
    if (minutes < 12 * 60) {
      morning.push(s);
    } else if (minutes < 17 * 60) {
      afternoon.push(s);
    } else {
      evening.push(s);
    }
  }

  const groups: SlotGroup[] = [];
  if (morning.length > 0) groups.push({ period: 'Morning', slots: morning });
  if (afternoon.length > 0) groups.push({ period: 'Afternoon', slots: afternoon });
  if (evening.length > 0) groups.push({ period: 'Evening', slots: evening });

  return groups;
}

/**
 * Finds the closest available alternatives to a conflicted slot.
 */
export function findClosestAlternativeSlots(
  availableSlots: Slot[],
  conflictedTime: string,
  limit = 4
): Slot[] {
  const targetMinutes = timeToMinutes(conflictedTime);

  const freeSlots = availableSlots.filter((s) => !s.isBooked && !s.isPast);

  // Sort by distance in minutes from requested time
  return [...freeSlots]
    .sort((a, b) => {
      const distA = Math.abs(timeToMinutes(a.startTime) - targetMinutes);
      const distB = Math.abs(timeToMinutes(b.startTime) - targetMinutes);
      return distA - distB;
    })
    .slice(0, limit);
}
