import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRunningSaleItem {
  menuItemId: mongoose.Types.ObjectId;
  itemName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface IRunningSale extends Document {
  orderNumber: string;
  customerOrTable: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  items: IRunningSaleItem[];
  notes?: string;
  status: 'open' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const RunningSaleItemSchema = new Schema<IRunningSaleItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const RunningSaleSchema = new Schema<IRunningSale>(
  {
    orderNumber: {
      type: String,
      required: true,
    },
    customerOrTable: {
      type: String,
      default: '',
      trim: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    items: {
      type: [RunningSaleItemSchema],
      required: true,
      validate: {
        validator: (v: IRunningSaleItem[]) => v.length > 0,
        message: 'Running sale must have at least one item',
      },
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const RunningSale: Model<IRunningSale> =
  mongoose.models.RunningSale ||
  mongoose.model<IRunningSale>('RunningSale', RunningSaleSchema);

export default RunningSale;
