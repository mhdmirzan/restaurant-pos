import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/lib/models/MenuItem';
import RunningSale from '@/lib/models/RunningSale';

export async function GET() {
  try {
    await dbConnect();
    const runningSales = await RunningSale.find({ status: 'open' })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      runningSales: runningSales.map((rs) => ({
        _id: rs._id.toString(),
        orderNumber: rs.orderNumber,
        customerOrTable: rs.customerOrTable,
        subtotal: rs.subtotal,
        discount: rs.discount || 0,
        grandTotal: rs.grandTotal,
        items: rs.items.map((it) => ({
          menuItemId: it.menuItemId.toString(),
          itemName: it.itemName,
          price: it.price,
          quantity: it.quantity,
          total: it.total,
        })),
        notes: rs.notes || '',
        createdAt: rs.createdAt ? rs.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: rs.updatedAt ? rs.updatedAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching running sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch running sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { id, items, customerOrTable, discount = 0, notes = '' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Please add at least one item to save as running sale' },
        { status: 400 }
      );
    }

    const discountAmount = typeof discount === 'number' && discount >= 0 ? discount : 0;

    // Fetch menu items from DB to verify prices
    const menuItemIds = items.map((item: { menuItemId: string }) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      active: true,
    }).lean();

    const priceMap = new Map<string, { price: number; name: string }>();
    for (const mi of menuItems) {
      priceMap.set(mi._id.toString(), { price: mi.price, name: mi.name });
    }

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const quantity = Math.floor(Number(item.quantity));
      if (!quantity || quantity < 1 || quantity > 999) {
        return NextResponse.json(
          { error: 'Quantity must be between 1 and 999.' },
          { status: 400 }
        );
      }

      const dbItem = priceMap.get(item.menuItemId);
      const price = dbItem ? dbItem.price : Number(item.price || 0);
      const itemName = dbItem ? dbItem.name : String(item.name || item.itemName || 'Item');
      const lineTotal = price * quantity;
      subtotal += lineTotal;

      saleItems.push({
        menuItemId: item.menuItemId,
        itemName,
        price,
        quantity,
        total: lineTotal,
      });
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);
    const refName = (customerOrTable || '').trim() || 'Running Tab';

    // If ID provided, update existing running sale
    if (id) {
      const existing = await RunningSale.findById(id);
      if (existing && existing.status === 'open') {
        existing.customerOrTable = refName;
        existing.items = saleItems;
        existing.subtotal = subtotal;
        existing.discount = discountAmount;
        existing.grandTotal = grandTotal;
        existing.notes = notes;
        await existing.save();

        return NextResponse.json({
          message: 'Running sale updated successfully',
          runningSale: {
            _id: existing._id.toString(),
            orderNumber: existing.orderNumber,
            customerOrTable: existing.customerOrTable,
            subtotal: existing.subtotal,
            discount: existing.discount,
            grandTotal: existing.grandTotal,
            items: saleItems,
            notes: existing.notes,
            createdAt: existing.createdAt.toISOString(),
            updatedAt: existing.updatedAt.toISOString(),
          },
        });
      }
    }

    // Generate order number
    const countToday = await RunningSale.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    });

    const orderNumber = `TAB-${String(countToday + 1).padStart(3, '0')}`;

    const runningSale = await RunningSale.create({
      orderNumber,
      customerOrTable: refName,
      subtotal,
      discount: discountAmount,
      grandTotal,
      items: saleItems,
      notes,
      status: 'open',
    });

    return NextResponse.json(
      {
        message: 'Running sale saved successfully',
        runningSale: {
          _id: runningSale._id.toString(),
          orderNumber: runningSale.orderNumber,
          customerOrTable: runningSale.customerOrTable,
          subtotal: runningSale.subtotal,
          discount: runningSale.discount,
          grandTotal: runningSale.grandTotal,
          items: saleItems,
          notes: runningSale.notes,
          createdAt: runningSale.createdAt.toISOString(),
          updatedAt: runningSale.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving running sale:', error);
    return NextResponse.json(
      { error: 'Failed to save running sale' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Running sale ID is required' }, { status: 400 });
    }

    await RunningSale.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Running sale removed successfully' });
  } catch (error) {
    console.error('Error deleting running sale:', error);
    return NextResponse.json(
      { error: 'Failed to delete running sale' },
      { status: 500 }
    );
  }
}
