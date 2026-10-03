import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RunningSale from '@/lib/models/RunningSale';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const runningSale = await RunningSale.findById(id).lean();

    if (!runningSale) {
      return NextResponse.json({ error: 'Running sale not found' }, { status: 404 });
    }

    return NextResponse.json({
      runningSale: {
        _id: runningSale._id.toString(),
        orderNumber: runningSale.orderNumber,
        customerOrTable: runningSale.customerOrTable,
        subtotal: runningSale.subtotal,
        discount: runningSale.discount || 0,
        grandTotal: runningSale.grandTotal,
        items: runningSale.items.map((it) => ({
          menuItemId: it.menuItemId.toString(),
          itemName: it.itemName,
          price: it.price,
          quantity: it.quantity,
          total: it.total,
        })),
        notes: runningSale.notes || '',
        createdAt: runningSale.createdAt ? runningSale.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: runningSale.updatedAt ? runningSale.updatedAt.toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching running sale by ID:', error);
    return NextResponse.json({ error: 'Failed to fetch running sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    await RunningSale.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Running sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting running sale:', error);
    return NextResponse.json({ error: 'Failed to delete running sale' }, { status: 500 });
  }
}
