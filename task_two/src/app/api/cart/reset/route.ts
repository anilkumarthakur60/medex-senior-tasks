import { NextResponse } from 'next/server';
import { resetCartToInitial } from '../../../../lib/cartStore';

export async function POST() {
  const cart = resetCartToInitial();
  return NextResponse.json({ cart });
}
