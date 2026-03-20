import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_URL = 'https://n8n.fatherandsun.solar/webhook/9e7ba51f-1f65-43e0-b61f-0a29e02487f8';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: `Webhook failed: ${errorText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disposition API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit disposition' },
      { status: 500 }
    );
  }
}
