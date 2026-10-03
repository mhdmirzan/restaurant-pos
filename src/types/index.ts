export interface MenuItemType {
  _id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface SaleItemType {
  menuItemId: string;
  itemName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface SaleType {
  _id: string;
  billNumber: string;
  saleDate: string;
  customerOrTable: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  items: SaleItemType[];
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Other';

export interface RunningSaleItemType {
  menuItemId: string;
  name?: string;
  itemName?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface RunningSaleType {
  _id: string;
  orderNumber: string;
  customerOrTable: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  items: RunningSaleItemType[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryType {
  _id: string;
  name: string;
  emoji?: string;
  itemCount?: number;
  createdAt?: string;
}

export const CATEGORIES = [
  'Fried Rice',
  'Biryani',
  'Kothu',
  'Submarine',
  'Chicken',
  'Beverages',
  'Other',
] as const;

export type Category = string;

export interface ChartPoint {
  date: string;
  label: string;
  sales: number;
  bills: number;
}

export interface DashboardDataType {
  todaySales: number;
  todayBills: number;
  itemsSold: number;
  averageBill: number;
  recentSales: SaleType[];
  topItems: { _id: string; totalQuantity: number }[];
  salesChart: {
    week: ChartPoint[];
    month: ChartPoint[];
    year: ChartPoint[];
  };
}
