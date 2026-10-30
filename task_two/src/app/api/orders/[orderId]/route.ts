import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orderStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const order = getOrder(orderId);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.orderId,
    status: order.status,
    order,
  });
}
