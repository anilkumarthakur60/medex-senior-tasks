import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '300', 10);
  const fail = searchParams.get('fail') === '1';

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (fail) {
    return NextResponse.json(
      { error: 'Simulated API failure in providers endpoint' },
      { status: 500 }
    );
  }

  const filePath = path.join(process.cwd(), 'data', 'task1-service-explorer.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(fileData);

  return NextResponse.json({
    data: parsed.providers,
    meta: { count: parsed.providers.length },
  });
}
