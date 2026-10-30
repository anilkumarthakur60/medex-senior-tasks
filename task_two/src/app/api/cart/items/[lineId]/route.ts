import { NextRequest, NextResponse } from 'next/server';
import {
  updateItemQuantity,
  updateItemWellnessOption,
  removeItem,
} from '@/lib/cartStore';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '300', 10);
  const fail = searchParams.get('fail') === '1';
  const conflict = searchParams.get('conflict') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated server error updating cart line item' },
      { status: 500 }
    );
  }

  if (conflict) {
    return NextResponse.json(
      { error: 'Conflict: item quantity was modified in another session' },
      { status: 409 }
    );
  }

  const body = await request.json();

  if (typeof body.quantity === 'number') {
    const updatedCart = updateItemQuantity(lineId, body.quantity);
    return NextResponse.json({ cart: updatedCart });
  }

  if (typeof body.wellnessPricingId === 'string') {
    const updatedCart = updateItemWellnessOption(lineId, body.wellnessPricingId);
    return NextResponse.json({ cart: updatedCart });
  }

  return NextResponse.json(
    { error: 'Invalid payload: provide quantity or wellnessPricingId' },
    { status: 400 }
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '200', 10);

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const updatedCart = removeItem(lineId);
  return NextResponse.json({ cart: updatedCart }, { status: 200 });
}
