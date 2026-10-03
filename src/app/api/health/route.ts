import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: 'connected' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Health check DB connection error:', err?.message || err);
    return NextResponse.json({ status: 'disconnected', error: err?.message || String(error) }, { status: 500 });
  }
}
