import { describe, it, expect } from 'vitest';
import { normalizeTimezone, formatDualTime } from '../timezone';

describe('timezone normalization', () => {
  it('handles standard IANA timezone correctly', () => {
    expect(normalizeTimezone('Asia/Bangkok', 'TH')).toBe('Asia/Bangkok');
  });

  it('handles offset with leading whitespace: " UTC+05:45"', () => {
    expect(normalizeTimezone(' UTC+05:45', 'NP')).toBe('Asia/Kathmandu');
  });

  it('handles Windows-style name: "Nepal Standard Time"', () => {
    expect(normalizeTimezone('Nepal Standard Time', 'NP')).toBe('Asia/Kathmandu');
  });

  it('handles parenthesized GMT offset: "(GMT+5:45)"', () => {
    expect(normalizeTimezone('(GMT+5:45)', 'NP')).toBe('Asia/Kathmandu');
  });

  it('handles IANA name with trailing whitespace and alternate spelling: "Asia/Katmandu "', () => {
    expect(normalizeTimezone('Asia/Katmandu ', 'NP')).toBe('Asia/Kathmandu');
  });

  it('falls back to provider country when timezone is empty string: ""', () => {
    expect(normalizeTimezone('', 'IN')).toBe('Asia/Kolkata');
    expect(normalizeTimezone('', 'TH')).toBe('Asia/Bangkok');
    expect(normalizeTimezone('', 'NP')).toBe('Asia/Kathmandu');
  });

  it('falls back to provider country when timezone is whitespace only', () => {
    expect(normalizeTimezone('   ', 'IN')).toBe('Asia/Kolkata');
  });
});

describe('formatDualTime', () => {
  it('correctly calculates difference between Bangkok (UTC+7) and Kathmandu (UTC+5:45)', () => {
    // 11:20 Bangkok time is 1 hour and 15 minutes ahead of Kathmandu time (10:05)
    const result = formatDualTime(
      '2026-11-10',
      '11:20',
      'Asia/Bangkok',
      'Asia/Kathmandu'
    );

    expect(result.providerTime).toBe('11:20');
    expect(result.customerTime).toBe('10:05');
    expect(result.isDifferentDay).toBe(false);
  });

  it('detects when an appointment crosses midnight into a different day for customer', () => {
    // 00:30 Bangkok time on Nov 10 is 23:15 on Nov 9 in Kathmandu
    const result = formatDualTime(
      '2026-11-10',
      '00:30',
      'Asia/Bangkok',
      'Asia/Kathmandu'
    );

    expect(result.providerTime).toBe('00:30');
    expect(result.customerTime).toBe('23:15');
    expect(result.isDifferentDay).toBe(true);
    expect(result.dayDifferenceDesc).toBe('Previous day for you');
  });
});
