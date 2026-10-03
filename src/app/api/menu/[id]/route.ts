import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/lib/models/MenuItem';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
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

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        category,
        price,
        active: active !== undefined ? active : true,
      },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(menuItem);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update menu item error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Item deleted successfully',
      item: deletedItem,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete menu item error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
