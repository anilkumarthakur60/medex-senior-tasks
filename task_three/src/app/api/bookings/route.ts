import { NextRequest, NextResponse } from 'next/server';
import { bookAppointment } from '@/lib/bookingStore';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '400', 10);
  const fail = searchParams.get('fail') === '1';
  const conflict = searchParams.get('conflict') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated server failure during booking' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { providerId, specialistId, date, startTime, numberOfPeople } = body;

  if (!providerId || !specialistId || !date || !startTime) {
    return NextResponse.json(
      { error: 'Missing required booking fields' },
      { status: 400 }
    );
  }

  const result = bookAppointment(
    Number(providerId),
    specialistId,
    date,
    startTime,
    numberOfPeople || 1,
    conflict
  );

  if (result.conflict) {
    return NextResponse.json(
      { message: result.error, conflict: true },
      { status: 409 }
    );
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      bookingId: result.booking!.bookingId,
      booking: result.booking,
    },
    { status: 201 }
  );
}
