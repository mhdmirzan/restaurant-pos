import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/lib/models/MenuItem';

export async function GET() {
  try {
    await dbConnect();
    const items = await MenuItem.find({}).sort({ category: 1, name: 1 }).lean();
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { name, category, price, active } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Name, category, and price are required' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a non-negative number' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    const menuItem = await MenuItem.create({
      name: name.trim(),
      category,
      price,
      active: active !== undefined ? active : true,
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error: unknown) {
    console.error('Create menu item error:', error);
    const err = error as { code?: number; message?: string };
    if (err.code === 11000) {
      return NextResponse.json(
        { error: 'A menu item with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
