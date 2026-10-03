import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISaleItem {
  menuItemId: mongoose.Types.ObjectId;
  itemName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface ISale extends Document {
  billNumber: string;
  saleDate: Date;
  customerOrTable: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  items: ISaleItem[];
  createdAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
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

const SaleSchema = new Schema<ISale>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    saleDate: {
      type: Date,
      required: true,
    },
    customerOrTable: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Cash', 'Card', 'Bank Transfer', 'Other'],
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
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: (v: ISaleItem[]) => v.length > 0,
        message: 'Sale must have at least one item',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

export default Sale;
