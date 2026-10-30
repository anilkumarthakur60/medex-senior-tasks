import { NextRequest, NextResponse } from 'next/server';
import { createOrRetrieveOrder } from '../../../lib/orderStore';
import { removeItems } from '../../../lib/cartStore';
import { CartLineItem, PaymentMethod } from '../../../types';

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '500', 10);
  const fail = searchParams.get('fail') === '1';
  const conflict = searchParams.get('conflict') === '1';
  const paymentFail = searchParams.get('payment_fail') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const body = await request.json();
  const {
    groupType,
    items,
    paymentMethod,
    idempotencyKey,
  }: {
    groupType: string;
    items: CartLineItem[];
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
  } = body;

  if (!groupType || !items || !paymentMethod || !idempotencyKey) {
    return NextResponse.json(
      { error: 'Missing required checkout fields' },
      { status: 400 }
    );
  }

  // Calculate subtotals
  const subtotals: Record<string, number> = {};
  for (const item of items) {
    const currency = item.product.currency || 'USD';
    let unitPrice = item.product.price || 0;
    if (item.wellnessPricingId && item.product.wellnessPricing) {
      const opt = item.product.wellnessPricing.find(
        (o) => o.id === item.wellnessPricingId
      );
      if (opt) unitPrice = opt.amount_after_service_charge;
    }
    subtotals[currency] = (subtotals[currency] || 0) + unitPrice * item.quantity;
  }

  let simError: 'none' | 'payment_failed' | 'conflict_409' | 'server_500' = 'none';
  if (conflict) simError = 'conflict_409';
  else if (paymentFail) simError = 'payment_failed';
  else if (fail) simError = 'server_500';

  const result = createOrRetrieveOrder(
    groupType,
    items,
    paymentMethod,
    idempotencyKey,
    subtotals,
    simError
  );

  if (result.status >= 400) {
    return NextResponse.json(
      { error: result.error, orderId: result.order?.orderId },
      { status: result.status }
    );
  }

  // Remove the ordered items from the cart
  const itemIds = items.map((i) => i.id);
  removeItems(itemIds);

  return NextResponse.json(
    {
      orderId: result.order!.orderId,
      status: result.order!.status,
      order: result.order!,
    },
    { status: result.status }
  );
}
