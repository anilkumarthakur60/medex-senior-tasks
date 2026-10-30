import { NextRequest, NextResponse } from 'next/server';
import { mergeGuestCart } from '../../../../lib/cartStore';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '300', 10);
  const fail = searchParams.get('fail') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated failure during guest cart merge' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const guestItems = body.items || [];

  const result = mergeGuestCart(guestItems);
  return NextResponse.json(result);
}
