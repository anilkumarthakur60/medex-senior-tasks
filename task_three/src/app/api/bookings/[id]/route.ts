import { NextRequest, NextResponse } from 'next/server';
import { rescheduleAppointment } from '@/lib/bookingStore';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '400', 10);
  const conflict = searchParams.get('conflict') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const body = await request.json();
  const { date, startTime } = body;

  if (!date || !startTime) {
    return NextResponse.json(
      { error: 'Missing date or startTime for reschedule' },
      { status: 400 }
    );
  }

  const result = rescheduleAppointment(id, date, startTime, conflict);

  if (result.conflict) {
    return NextResponse.json(
      { message: result.error, conflict: true },
      { status: 409 }
    );
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    bookingId: id,
    booking: result.booking,
    status: 200,
  });
}
