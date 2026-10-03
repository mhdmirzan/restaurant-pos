'use client';

import { CartItem, PaymentMethod, SaleType, RunningSaleType } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { printThermalReceipt } from '@/lib/printReceipt';
import {
  Banknote,
  CreditCard,
  Landmark,
  Wallet,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Printer,
  MapPin,
  AlertCircle,
  Clock,
  BookmarkPlus,
} from 'lucide-react';

interface BillPanelProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod | '';
  customerOrTable: string;
  saving: boolean;
  successMessage: string;
  errorMessage: string;
  savedBillNumber: string;
  savedSale: SaleType | null;
  activeRunningSale?: RunningSaleType | null;
  holdingRunningSale?: boolean;
  onHoldRunningSale?: () => void;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onSetDiscount: (discount: number) => void;
  onSetPaymentMethod: (method: PaymentMethod) => void;
  onSetCustomerOrTable: (value: string) => void;
  onSaveSale: () => void;
  onNewBill: () => void;
}

const paymentMethods: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'Card', label: 'Card', icon: CreditCard },
  { value: 'Bank Transfer', label: 'Transfer', icon: Landmark },
  { value: 'Other', label: 'Other', icon: Wallet },
];

export default function BillPanel({
  cart,
  subtotal,
  discount,
  grandTotal,
  paymentMethod,
  customerOrTable,
  saving,
  successMessage,
  errorMessage,
  savedBillNumber,
  savedSale,
  activeRunningSale,
  holdingRunningSale = false,
  onHoldRunningSale,
  onUpdateQuantity,
  onRemoveItem,
  onSetDiscount,
  onSetPaymentMethod,
  onSetCustomerOrTable,
  onSaveSale,
  onNewBill,
}: BillPanelProps) {
  const handlePrint = () => {
    if (savedSale) {
      printThermalReceipt(savedSale);
    } else {
      window.print();
    }
  };

  // Success state with printable receipt
  if (successMessage) {
    return (
      <div className="flex flex-col h-full bg-white p-6 overflow-y-auto">
        {/* Receipt Card - Formatted for Screen & Thermal Printers */}
        <div id="pos-receipt" className="printable-receipt border border-border bg-slate-50/70 rounded-xl p-4 text-xs mb-5 shadow-2xs">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-center mb-2">
              <img src="/logo.jpg" alt="Food Corner Logo" className="h-20 w-auto object-contain" />
            </div>
            <h4 className="font-black text-lg text-slate-900 tracking-wide">FOOD CORNER</h4>
            <p className="text-[11px] text-slate-600 font-medium">No. 30 Teldeniya Road Menikhinna</p>
            <p className="text-[11px] text-slate-600 font-medium">Phone: 0756655172</p>
            <p className="text-sm font-bold text-slate-900 mt-1 font-mono">BILL: {savedBillNumber}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {savedSale ? formatDate(savedSale.saleDate) : ''} • {savedSale ? formatTime(savedSale.createdAt) : ''}
            </p>
          </div>

          {/* Items Table - All in one line */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dashed border-slate-300 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="text-left pb-1.5 font-bold">Item</th>
                  <th className="text-center pb-1.5 w-10 font-bold">Qty</th>
                  <th className="text-right pb-1.5 w-20 font-bold">Price</th>
                  <th className="text-right pb-1.5 w-24 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dotted divide-slate-200">
                {savedSale?.items?.map((item, idx) => (
                  <tr key={idx} className="leading-snug">
                    <td className="py-2 text-left font-bold text-slate-900 truncate max-w-[130px]" title={item.itemName}>
                      {item.itemName}
                    </td>
                    <td className="py-2 text-center text-slate-800 font-mono font-extrabold text-[12px]">
                      {item.quantity}
                    </td>
                    <td className="py-2 text-right text-slate-600 font-mono text-[11px]">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-2 text-right font-extrabold text-slate-900 font-mono text-[12px]">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="pt-2.5 space-y-1 text-slate-700">
            <div className="flex justify-between text-xs font-medium">
              <span>Subtotal:</span>
              <span className="font-bold">{formatCurrency(savedSale?.subtotal || 0)}</span>
            </div>
            {(savedSale?.discount || 0) > 0 && (
              <div className="flex justify-between text-xs text-slate-700 font-medium">
                <span>Discount:</span>
                <span className="font-bold">-{formatCurrency(savedSale?.discount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-black pt-2 border-t-2 border-slate-900 tracking-wide">
              <span className="font-black text-black text-lg">GRAND TOTAL:</span>
              <span className="text-black font-black text-lg font-mono">{formatCurrency(savedSale?.grandTotal || 0)}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 text-slate-500 font-medium">
              <span>Paid by:</span>
              <span className="font-bold text-slate-800">{(savedSale?.paymentMethod || 'Cash').toUpperCase()}</span>
            </div>
          </div>

          <div className="text-center pt-3 text-[10px] text-slate-400 font-sans border-t border-dashed border-slate-300 mt-3">
            Thank you! Please visit again.
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 mt-auto no-print">
          <button
            onClick={handlePrint}
            className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>

          <button
            onClick={onNewBill}
            className="w-full bg-white border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs shadow-2xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            Start Next Bill
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Bill header */}
      <div className="px-4 py-3 border-b border-border bg-slate-50/60 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Current Order</h3>
          <p className="text-xs text-slate-400">Food Corner Register</p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onNewBill}
            className="text-xs text-slate-400 hover:text-slate-700 font-medium hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Running tab indicator banner if this bill was loaded from a running sale */}
      {activeRunningSale && (
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-1.5 font-bold min-w-0 pr-2">
            <span className="bg-amber-200 text-amber-950 text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold">
              {activeRunningSale.orderNumber}
            </span>
            <span className="truncate">
              Running Tab: {activeRunningSale.customerOrTable || 'Table Order'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
            Open Tab
          </span>
        </div>
      )}

      {/* Customer/Table */}
      <div className="px-4 py-2.5 border-b border-border bg-white shrink-0">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={customerOrTable}
            onChange={(e) => onSetCustomerOrTable(e.target.value)}
            placeholder="Table # or Customer Name (optional)"
            className="w-full text-xs pl-8 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 bg-slate-50/50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Order is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] text-center">
              Click any menu item to add it to this bill
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1.5 bg-slate-100/80 rounded-lg border border-slate-200/60 mb-2">
              <span className="flex-1">Item</span>
              <span className="w-24 text-center">Quantity</span>
              <span className="w-24 text-right">Total</span>
              <span className="w-7 text-right"></span>
            </div>

            {/* Item Rows - Single Line */}
            <div className="space-y-1.5">
              {cart.map((item, index) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-colors group shadow-2xs"
                >
                  {/* Item Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 font-mono shrink-0">#{index + 1}</span>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="w-24 flex items-center justify-center shrink-0">
                    <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-0.5 shadow-2xs">
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="w-24 text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatCurrency(item.total)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <div className="w-7 flex justify-end shrink-0">
                    <button
                      onClick={() => onRemoveItem(item.menuItemId)}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section */}
      {cart.length > 0 && (
        <div className="border-t border-border bg-white px-4 py-3 space-y-3 shrink-0">
          {/* Totals Breakdown */}
          <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-400">Rs.</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => onSetDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-20 text-right text-xs px-2 py-1 border border-border rounded-lg bg-white focus:outline-none focus:border-slate-600 font-medium"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">GRAND TOTAL</span>
              <span className="text-base font-black text-slate-900">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment method selector */}
          <div>
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Payment Method <span className="text-slate-400">*</span>
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map((pm) => {
                const IconComponent = pm.icon;
                return (
                  <button
                    key={pm.value}
                    onClick={() => onSetPaymentMethod(pm.value)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === pm.value
                        ? 'border-slate-800 bg-slate-800 text-white shadow-xs'
                        : 'border-border text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-[11px] truncate w-full text-center">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-slate-100 border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action buttons: Hold as Running Sale & Complete Sale */}
          <div className="space-y-2">
            {onHoldRunningSale && (
              <button
                type="button"
                onClick={onHoldRunningSale}
                disabled={holdingRunningSale || saving || cart.length === 0}
                className="w-full py-2.5 rounded-xl font-bold text-xs border border-amber-300/90 bg-amber-50/80 hover:bg-amber-100 text-amber-900 transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                {holdingRunningSale ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                    Saving to Running Sales...
                  </span>
                ) : activeRunningSale ? (
                  <span>Save Changes to Running Tab ({activeRunningSale.orderNumber})</span>
                ) : (
                  <span>Hold as Running Sale (Pay Later)</span>
                )}
              </button>
            )}

            {/* Save Sale Button */}
            <button
              onClick={onSaveSale}
              disabled={saving || cart.length === 0 || !paymentMethod}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs ${
                saving || cart.length === 0 || !paymentMethod
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.99]'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Sale...
                </span>
              ) : !paymentMethod ? (
                'Select Payment to Complete'
              ) : (
                `Complete Sale • ${formatCurrency(grandTotal)}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
