import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/lib/models/MenuItem';
import Sale from '@/lib/models/Sale';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const { items, paymentMethod, customerOrTable, discount } = body;

    // Validate payment method
    const validPaymentMethods = ['Cash', 'Card', 'Bank Transfer', 'Other'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Please select a valid payment method' },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Please add at least one item to the bill' },
        { status: 400 }
      );
    }

    // Validate discount
    const discountAmount = typeof discount === 'number' && discount >= 0 ? discount : 0;

    // Fetch menu items from DB and compute server-side prices
    const menuItemIds = items.map((item: { menuItemId: string }) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      active: true,
    }).lean();

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        { error: 'One or more items are invalid or inactive. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Build a price lookup from DB
    const priceMap = new Map<string, { price: number; name: string }>();
    for (const mi of menuItems) {
      priceMap.set(mi._id.toString(), { price: mi.price, name: mi.name });
    }

    // Build sale items with server-side prices
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const quantity = Math.floor(Number(item.quantity));
      if (!quantity || quantity < 1 || quantity > 999) {
        return NextResponse.json(
          { error: `Invalid quantity for item. Quantity must be between 1 and 999.` },
          { status: 400 }
        );
      }

      const dbItem = priceMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { error: 'Item not found in database' },
          { status: 400 }
        );
      }

      const lineTotal = dbItem.price * quantity;
      subtotal += lineTotal;

      saleItems.push({
        menuItemId: item.menuItemId,
        itemName: dbItem.name,
        price: dbItem.price,
        quantity,
        total: lineTotal,
      });
    }

    const grandTotal = Math.max(0, subtotal - discountAmount);

    // Generate bill number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Count today's sales to generate sequential number
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySalesCount = await Sale.countDocuments({
      saleDate: { $gte: startOfDay, $lte: endOfDay },
    });

    const sequenceNumber = String(todaySalesCount + 1).padStart(4, '0');
    let billNumber = `FC-${dateStr}-${sequenceNumber}`;

    // Ensure unique bill number (retry with increment if collision)
    let attempts = 0;
    while (attempts < 10) {
      const existing = await Sale.findOne({ billNumber }).lean();
      if (!existing) break;
      attempts++;
      const newSeq = String(todaySalesCount + 1 + attempts).padStart(4, '0');
      billNumber = `FC-${dateStr}-${newSeq}`;
    }

    // Create sale
    const sale = await Sale.create({
      billNumber,
      saleDate: now,
      customerOrTable: customerOrTable?.trim() || '',
      paymentMethod,
      subtotal,
      discount: discountAmount,
      grandTotal,
      items: saleItems,
    });

    // If this sale was completed from an active running sale tab, remove it
    if (body.runningSaleId) {
      try {
        const RunningSale = (await import('@/lib/models/RunningSale')).default;
        await RunningSale.findByIdAndDelete(body.runningSaleId);
      } catch (err) {
        console.warn('Could not remove running sale after checkout:', err);
      }
    }

    return NextResponse.json(
      {
        message: 'Sale saved successfully',
        sale: {
          _id: sale._id.toString(),
          billNumber: sale.billNumber,
          saleDate: sale.saleDate ? sale.saleDate.toISOString() : now.toISOString(),
          customerOrTable: sale.customerOrTable,
          paymentMethod: sale.paymentMethod,
          subtotal: sale.subtotal,
          discount: sale.discount,
          grandTotal: sale.grandTotal,
          items: saleItems,
          createdAt: sale.createdAt ? sale.createdAt.toISOString() : now.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sale creation error:', error);
    return NextResponse.json(
      { error: 'Failed to save sale. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let dateFilter = {};
    const now = new Date();

    if (filter === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      dateFilter = { saleDate: { $gte: start, $lte: end } };
    } else if (filter === 'yesterday') {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      dateFilter = { saleDate: { $gte: start, $lte: end } };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { saleDate: { $gte: start, $lte: end } };
    }

    const sales = await Sale.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(sales);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}
