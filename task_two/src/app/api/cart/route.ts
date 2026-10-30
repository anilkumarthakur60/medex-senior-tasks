import { NextRequest, NextResponse } from 'next/server';
import { getCart } from '../../../lib/cartStore';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '300', 10);
  const fail = searchParams.get('fail') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated API failure loading cart' },
      { status: 500 }
    );
  }

  const cart = getCart();
  return NextResponse.json({ cart });
}
