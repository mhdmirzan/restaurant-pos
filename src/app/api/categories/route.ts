import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import MenuItem from '@/lib/models/MenuItem';

const DEFAULT_CATEGORIES = [
  { name: 'Fried Rice', emoji: '🍚' },
  { name: 'Biryani', emoji: '🍛' },
  { name: 'Kothu', emoji: '🥘' },
  { name: 'Submarine', emoji: '🥖' },
  { name: 'Chicken', emoji: '🍗' },
  { name: 'Beverages', emoji: '🥤' },
  { name: 'Other', emoji: '🍽️' },
];

export async function GET() {
  try {
    await dbConnect();

    let categories = await Category.find({}).sort({ createdAt: 1 }).lean();

    // Auto-seed defaults if database has no categories yet
    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find({}).sort({ createdAt: 1 }).lean();
    }

    // Get item counts per category
    const itemCounts = await MenuItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap: Record<string, number> = {};
    itemCounts.forEach((ic) => {
      countMap[ic._id] = ic.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      itemCount: countMap[cat.name] || 0,
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Fetch categories error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { name, emoji } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Case-insensitive duplicate check
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Category "${trimmedName}" already exists` },
        { status: 409 }
      );
    }

    const category = await Category.create({
      name: trimmedName,
      emoji: emoji && typeof emoji === 'string' && emoji.trim() ? emoji.trim() : '🍽️',
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create category error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
