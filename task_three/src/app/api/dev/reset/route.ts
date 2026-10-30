import { NextResponse } from 'next/server';
import { resetBookingStore } from '@/lib/bookingStore';

export async function POST() {
  resetBookingStore();
  return NextResponse.json({ success: true });
}
