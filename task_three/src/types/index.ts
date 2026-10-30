export interface DaySchedule {
  startTime: string; // "08:00"
  endTime: string;   // "20:00"
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ConsultationHours {
  startTime: string; // "10:00"
  endTime: string;   // "16:00"
  durationInMinutes: number; // e.g. 30
  bufferInMinutes: number;   // e.g. 10
}

export interface Specialist {
  id: string;
  name: string;
  speciality: string;
  consultation: ConsultationHours;
}

export interface Provider {
  id: number;
  name: string;
  country: string; // "TH", "NP", "IN"
  timezone: string; // raw timezone string from data
  daySchedules: Partial<Record<DayOfWeek, DaySchedule>>;
  specialists: Specialist[];
}

export interface Closure {
  providerId: number;
  dayOffset: number;
  reason: string;
}

export interface BookedSlot {
  providerId: number;
  specialistId: string;
  dayOffset: number;
  startTime: string; // "10:40"
}

export interface ExistingBooking {
  bookingId: string;
  providerId: number;
  specialistId: string;
  dayOffset: number;
  startTime: string;
  numberOfPeople: number;
}

export interface Slot {
  startTime: string; // "10:00"
  endTime: string;   // "10:30"
  isBooked: boolean;
  isPast: boolean;
  specialistId: string;
  providerId: number;
  durationMinutes: number;
}

export interface SlotGroup {
  period: 'Morning' | 'Afternoon' | 'Evening';
  slots: Slot[];
}

export interface BookingPayload {
  providerId: number;
  specialistId: string;
  date: string; // YYYY-MM-DD in provider's local date
  startTime: string; // "10:00"
  numberOfPeople: number; // 1 to 4
}

export interface BookingConfirmation {
  bookingId: string;
  providerId: number;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  providerTimezone: string;
  createdAt: string;
}

export interface DayAvailability {
  dateString: string; // YYYY-MM-DD
  dayOffset: number;
  isPast: boolean;
  isClosed: boolean;
  closureReason?: string;
  hasFreeSlots: boolean;
  availableSlotCount: number;
}
