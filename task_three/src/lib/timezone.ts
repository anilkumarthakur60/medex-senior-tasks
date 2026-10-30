import { DateTime } from 'luxon';

const WINDOWS_TIMEZONES: Record<string, string> = {
  'nepal standard time': 'Asia/Kathmandu',
  'india standard time': 'Asia/Kolkata',
  'se asia standard time': 'Asia/Bangkok',
  'thai standard time': 'Asia/Bangkok',
};

const COUNTRY_FALLBACKS: Record<string, string> = {
  TH: 'Asia/Bangkok',
  NP: 'Asia/Kathmandu',
  IN: 'Asia/Kolkata',
};

/**
 * Normalizes any free-form timezone string from provider data into a valid IANA timezone identifier.
 *
 * Supported formats:
 * - Standard IANA: "Asia/Bangkok", "Asia/Katmandu " -> "Asia/Kathmandu"
 * - Leading/trailing spaces trimmed
 * - Windows names: "Nepal Standard Time" -> "Asia/Kathmandu"
 * - Offset strings: " UTC+05:45", "(GMT+5:45)", "GMT+05:45", "+05:45" -> "UTC+5:45"
 * - Empty string or unparseable: falls back to provider country code (TH, NP, IN)
 */
export function normalizeTimezone(rawTimezone: string | null | undefined, country: string): string {
  const countryFallback = COUNTRY_FALLBACKS[country.toUpperCase()] || 'UTC';

  if (!rawTimezone) {
    return countryFallback;
  }

  const trimmed = rawTimezone.trim();
  if (!trimmed) {
    return countryFallback;
  }

  const lower = trimmed.toLowerCase();

  // 1. Windows names check
  if (WINDOWS_TIMEZONES[lower]) {
    return WINDOWS_TIMEZONES[lower];
  }

  // 2. Canonical mapping for common legacy or misspelled IANA names
  if (lower === 'asia/katmandu' || lower.startsWith('asia/katmandu')) {
    return 'Asia/Kathmandu';
  }

  // 3. Offset formats like "(GMT+5:45)", "UTC+05:45", "GMT+5:45", "+05:45"
  const offsetMatch = trimmed.match(/(?:GMT|UTC)?\s*([+-]\d{1,2}(?::\d{2})?)/i);
  if (offsetMatch) {
    const offsetStr = offsetMatch[1];
    // Check if it's the known +5:45 Nepal offset
    if (offsetStr === '+5:45' || offsetStr === '+05:45') {
      return 'Asia/Kathmandu';
    }
    if (offsetStr === '+5:30' || offsetStr === '+05:30') {
      return 'Asia/Kolkata';
    }
    if (offsetStr === '+7' || offsetStr === '+07' || offsetStr === '+07:00') {
      return 'Asia/Bangkok';
    }
    // Luxon supports UTC offsets directly as "UTC+5:45"
    return `UTC${offsetStr}`;
  }

  // 4. Validate if Luxon recognizes it directly
  const dt = DateTime.now().setZone(trimmed);
  if (dt.isValid) {
    return trimmed;
  }

  // 5. Fallback to provider country
  return countryFallback;
}

/**
 * Formats a provider wall-clock time into both provider and customer timezones.
 * e.g., "11:20 Bangkok time (10:05 Kathmandu time)"
 */
export function formatDualTime(
  dateString: string, // YYYY-MM-DD
  timeString: string, // HH:mm in provider timezone
  providerTz: string,
  customerTz: string
): {
  providerDate: string;
  providerTime: string;
  providerTzLabel: string;
  customerDate: string;
  customerTime: string;
  customerTzLabel: string;
  isDifferentDay: boolean;
  dayDifferenceDesc?: string;
} {
  // Construct DateTime in provider's local zone
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  const providerDt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: providerTz }
  );

  const customerDt = providerDt.setZone(customerTz);

  const providerDate = providerDt.toFormat('ccc, d LLL yyyy');
  const providerTime = providerDt.toFormat('HH:mm');
  const providerTzLabel = providerDt.toFormat('ZZZZ (ZZ)');

  const customerDate = customerDt.toFormat('ccc, d LLL yyyy');
  const customerTime = customerDt.toFormat('HH:mm');
  const customerTzLabel = customerDt.toFormat('ZZZZ (ZZ)');

  const isDifferentDay = providerDt.toFormat('yyyy-MM-dd') !== customerDt.toFormat('yyyy-MM-dd');

  let dayDifferenceDesc: string | undefined;
  if (isDifferentDay) {
    const diffDays = customerDt.startOf('day').diff(providerDt.startOf('day'), 'days').days;
    if (diffDays > 0) {
      dayDifferenceDesc = 'Next day for you';
    } else {
      dayDifferenceDesc = 'Previous day for you';
    }
  }

  return {
    providerDate,
    providerTime,
    providerTzLabel,
    customerDate,
    customerTime,
    customerTzLabel,
    isDifferentDay,
    dayDifferenceDesc,
  };
}

/**
 * Converts a provider's local date YYYY-MM-DD into the corresponding dayOffset from today at the provider.
 */
export function dateToDayOffset(dateString: string, providerTz: string): number {
  const targetDate = DateTime.fromISO(dateString, { zone: providerTz }).startOf('day');
  const todayAtProvider = DateTime.now().setZone(providerTz).startOf('day');
  return Math.round(targetDate.diff(todayAtProvider, 'days').days);
}

/**
 * Converts a dayOffset into a YYYY-MM-DD string at the provider.
 */
export function dayOffsetToDate(dayOffset: number, providerTz: string): string {
  const todayAtProvider = DateTime.now().setZone(providerTz).startOf('day');
  return todayAtProvider.plus({ days: dayOffset }).toFormat('yyyy-MM-dd');
}

