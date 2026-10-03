import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import MenuItem from '@/lib/models/MenuItem';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if any menu items are assigned to this category
    const itemsUsingCategory = await MenuItem.countDocuments({
      category: category.name,
    });

    if (itemsUsingCategory > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${category.name}" because ${itemsUsingCategory} menu item(s) are assigned to it. Please reassign or delete those items first.`,
          count: itemsUsingCategory,
        },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({
      message: `Category "${category.name}" deleted successfully`,
      deletedId: id,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete category error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
