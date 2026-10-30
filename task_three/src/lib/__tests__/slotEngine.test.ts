import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  timeToMinutes,
  minutesToTime,
  generateSpecialistSlots,
  filterSlotsForGroupSize,
  findClosestAlternativeSlots,
} from '../slotEngine';
import { Provider, Specialist } from '../../types';

describe('slotEngine', () => {
  describe('time conversion helpers', () => {
    it('converts HH:mm to minutes and back', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('08:30')).toBe(510);
      expect(timeToMinutes('16:00')).toBe(960);
      expect(minutesToTime(510)).toBe('08:30');
      expect(minutesToTime(960)).toBe('16:00');
    });
  });

  const sampleSpecialist: Specialist = {
    id: 'spec-1',
    name: 'Dr. A. Wongsakul',
    speciality: 'Cardiology',
    consultation: {
      startTime: '10:00',
      endTime: '16:00',
      durationInMinutes: 30,
      bufferInMinutes: 10,
    },
  };

  const sampleProvider: Provider = {
    id: 48,
    name: 'Riverside International Hospital',
    country: 'TH',
    timezone: 'Asia/Bangkok',
    daySchedules: {
      monday: { startTime: '08:00', endTime: '20:00' },
      friday: { startTime: '08:00', endTime: '17:00' },
      saturday: { startTime: '09:00', endTime: '13:00' },
    },
    specialists: [sampleSpecialist],
  };

  describe('generateSpecialistSlots', () => {
    it('generates slots repeating every duration + buffer, ending by consultation.endTime', () => {
      // 10:00 - 16:00 with 30 duration + 10 buffer:
      // Slots: 10:00 (ends 10:30), 10:40 (11:10), 11:20 (11:50), 12:00 (12:30),
      // 12:40 (13:10), 13:20 (13:50), 14:00 (14:30), 14:40 (15:10), 15:20 (15:50).
      // Next slot would start at 16:00, ending at 16:30, which exceeds 16:00, so not offered!
      const bookedSet = new Set<string>(['10:40']);
      const result = generateSpecialistSlots(
        sampleProvider,
        sampleSpecialist,
        '2026-11-09', // Monday
        10,
        bookedSet,
        'Asia/Bangkok'
      );

      expect(result.isProviderClosed).toBe(false);
      expect(result.slots.length).toBe(9);

      const startTimes = result.slots.map((s) => s.startTime);
      expect(startTimes).toEqual([
        '10:00',
        '10:40',
        '11:20',
        '12:00',
        '12:40',
        '13:20',
        '14:00',
        '14:40',
        '15:20',
      ]);

      // Check booked slot flag
      const slot1040 = result.slots.find((s) => s.startTime === '10:40');
      expect(slot1040?.isBooked).toBe(true);
      const slot1000 = result.slots.find((s) => s.startTime === '10:00');
      expect(slot1000?.isBooked).toBe(false);
    });

    it('excludes slots that lie outside the provider opening hours', () => {
      // On Saturday, provider closes at 13:00!
      // Specialist hours are 10:00 - 16:00.
      // Slots: 10:00 (10:30), 10:40 (11:10), 11:20 (11:50), 12:00 (12:30), 12:40 (13:10 -> exceeds 13:00!).
      // So only 4 slots should be within provider hours: 10:00, 10:40, 11:20, 12:00.
      const result = generateSpecialistSlots(
        sampleProvider,
        sampleSpecialist,
        '2026-11-07', // Saturday
        8,
        new Set(),
        'Asia/Bangkok'
      );

      expect(result.slots.length).toBe(4);
      expect(result.slots.map((s) => s.startTime)).toEqual([
        '10:00',
        '10:40',
        '11:20',
        '12:00',
      ]);
      expect(result.scheduleOverlapNote).toBeDefined();
    });

    it('marks day as closed if provider is not scheduled on that weekday', () => {
      // Sunday is not in sampleProvider.daySchedules
      const result = generateSpecialistSlots(
        sampleProvider,
        sampleSpecialist,
        '2026-11-08', // Sunday
        9,
        new Set(),
        'Asia/Bangkok'
      );

      expect(result.isProviderClosed).toBe(true);
      expect(result.slots.length).toBe(0);
    });

    it('marks slots as isPast if evaluating for today and time already passed at provider', () => {
      // Mock provider clock at 11:00 AM Bangkok time
      const mockNow = DateTime.fromISO('2026-11-09T11:00:00', { zone: 'Asia/Bangkok' });

      const result = generateSpecialistSlots(
        sampleProvider,
        sampleSpecialist,
        '2026-11-09',
        0, // today at provider
        new Set(),
        'Asia/Bangkok',
        mockNow
      );

      // 10:00 and 10:40 should be isPast: true
      const slot1000 = result.slots.find((s) => s.startTime === '10:00');
      const slot1040 = result.slots.find((s) => s.startTime === '10:40');
      const slot1120 = result.slots.find((s) => s.startTime === '11:20');

      expect(slot1000?.isPast).toBe(true);
      expect(slot1040?.isPast).toBe(true);
      expect(slot1120?.isPast).toBe(false);
    });
  });

  describe('filterSlotsForGroupSize', () => {
    it('requires N consecutive free slots for group size N', () => {
      // Slots: 10:00 (free), 10:40 (BOOKED), 11:20 (free), 12:00 (free), 12:40 (free)
      const baseSlots = [
        {
          startTime: '10:00',
          endTime: '10:30',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '10:40',
          endTime: '11:10',
          isBooked: true, // BOOKED
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '11:20',
          endTime: '11:50',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '12:00',
          endTime: '12:30',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '12:40',
          endTime: '13:10',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
      ];

      // For 2 people:
      // 10:00 cannot fit 2 people because next slot (10:40) is booked!
      // 11:20 CAN fit 2 people (11:20 and 12:00 are free)
      // 12:00 CAN fit 2 people (12:00 and 12:40 are free)
      const filtered = filterSlotsForGroupSize(baseSlots, 2);

      const slot1000 = filtered.find((s) => s.startTime === '10:00');
      const slot1120 = filtered.find((s) => s.startTime === '11:20');
      const slot1200 = filtered.find((s) => s.startTime === '12:00');

      expect(slot1000?.isBooked).toBe(true); // Unavailable for group
      expect(slot1120?.isBooked).toBe(false); // Available start time for group
      expect(slot1200?.isBooked).toBe(false); // Available start time for group
    });
  });

  describe('findClosestAlternativeSlots', () => {
    it('returns closest open slots ordered by proximity to conflicted time', () => {
      const slots = [
        {
          startTime: '10:00',
          endTime: '10:30',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '10:40',
          endTime: '11:10',
          isBooked: true, // Booked
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '11:20',
          endTime: '11:50',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
        {
          startTime: '14:00',
          endTime: '14:30',
          isBooked: false,
          isPast: false,
          specialistId: 'spec-1',
          providerId: 48,
          durationMinutes: 30,
        },
      ];

      // If 10:40 is conflicted, closest free slots are 10:00 (40m away) and 11:20 (40m away)
      const alternatives = findClosestAlternativeSlots(slots, '10:40', 2);
      expect(alternatives.length).toBe(2);
      const times = alternatives.map((a) => a.startTime);
      expect(times).toContain('10:00');
      expect(times).toContain('11:20');
    });
  });
});
