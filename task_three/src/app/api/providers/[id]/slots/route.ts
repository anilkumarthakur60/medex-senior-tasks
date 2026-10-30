import { NextRequest, NextResponse } from 'next/server';
import {
  getSlotsForDate,
  getCalendarAvailability,
  getExistingBooking,
} from '@/lib/bookingStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const providerId = parseInt(id, 10);

  const date = searchParams.get('date');
  const specialistId = searchParams.get('specialistId');
  const people = parseInt(searchParams.get('numberOfPeople') || '1', 10);
  const delay = parseInt(searchParams.get('delay') || '250', 10);
  const fail = searchParams.get('fail') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated API failure loading slots' },
      { status: 500 }
    );
  }

  // 90-day calendar availability summary
  const calendar = getCalendarAvailability(providerId, specialistId || undefined);
  const existingBooking = getExistingBooking();

  if (!date || !specialistId) {
    return NextResponse.json({
      calendar,
      slots: [],
      existingBooking,
    });
  }

  const slotData = getSlotsForDate(providerId, specialistId, date, people);

  return NextResponse.json({
    calendar,
    slots: slotData.slots,
    scheduleOverlapNote: slotData.scheduleOverlapNote,
    isProviderClosed: slotData.isProviderClosed,
    closureReason: slotData.closureReason,
    existingBooking,
  });
}
