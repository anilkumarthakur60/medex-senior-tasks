import { NextRequest, NextResponse } from 'next/server';
import { getProvider, getAllProviders } from '@/lib/bookingStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '250', 10);
  const fail = searchParams.get('fail') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated API failure loading provider' },
      { status: 500 }
    );
  }

  if (id === 'all') {
    return NextResponse.json({ providers: getAllProviders() });
  }

  const provider = getProvider(parseInt(id, 10));
  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  return NextResponse.json({ provider });
}
