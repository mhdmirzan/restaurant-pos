'use client';

import { useState, useEffect, useCallback } from 'react';
import { SaleType } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { printThermalReceipt } from '@/lib/printReceipt';
import {
  Receipt,
  Calendar,
  Clock,
  ShoppingBag,
  Coins,
  Printer,
  Eye,
  X,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,
  CheckCircle2,
  Store,
  Filter,
} from 'lucide-react';

function getPaymentIcon(method: string) {
  switch (method) {
    case 'Cash':
      return <Banknote className="w-3.5 h-3.5 text-slate-500" />;
    case 'Card':
      return <CreditCard className="w-3.5 h-3.5 text-slate-500" />;
    case 'Bank Transfer':
      return <Landmark className="w-3.5 h-3.5 text-slate-500" />;
    default:
      return <Wallet className="w-3.5 h-3.5 text-slate-500" />;
  }
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleType | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/sales?';
      if (filter === 'today' || filter === 'yesterday') {
        url += `filter=${filter}`;
      } else if (filter === 'range' && startDate && endDate) {
        url += `startDate=${startDate}&endDate=${endDate}`;
      } else {
        url += 'limit=100';
      }
      const res = await fetch(url);
      if (res.ok) {
        setSales(await res.json());
      }
    } catch {
      console.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Aggregate stats
  const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const billCount = sales.length;
  const itemsSold = sales.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pt-18 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-700" />
            Sales History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit and inspect completed customer bills and daily transaction receipts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {['today', 'yesterday', 'range'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-border hover:bg-slate-50'
            }`}
          >
            {f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : 'Date Range'}
          </button>
        ))}
        {filter === 'range' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-slate-600 bg-white"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-slate-600 bg-white"
            />
          </div>
        )}
      </div>

      {/* Stats - Always 3 in a row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Sales</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalSales)}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Bills</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{billCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Items Sold</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{itemsSold}</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 mt-2 font-medium">Loading sales history...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center">
            <Receipt className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
            <p className="font-medium text-slate-600">No sales found for this period</p>
            <p className="text-xs text-slate-400 mt-0.5">Completed bills will automatically appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Bill No</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Items Summary</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Payment</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-800">{sale.billNumber}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(sale.saleDate)}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTime(sale.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                      {sale.items.map((i) => `${i.itemName} ×${i.quantity}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-bold text-slate-900">{formatCurrency(sale.grandTotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                        {getPaymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-auto border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/70 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-700" />
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Bill Details</h2>
                  <p className="text-[11px] text-slate-500 font-mono font-medium">{selectedSale.billNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 printable-receipt">
              <div className="text-center mb-4 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-center mb-2">
                  <img src="/logo.jpg" alt="Food Corner Logo" className="h-20 w-auto object-contain" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">FOOD CORNER</h3>
                <p className="text-[11px] text-slate-600 font-medium">No. 30 Teldeniya Road Menikhinna</p>
                <p className="text-[11px] text-slate-600 font-medium">Phone: 0756655172</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(selectedSale.saleDate)} • {formatTime(selectedSale.createdAt)}
                </p>
              </div>

              <div className="pb-3 mb-3 border-b border-dashed border-slate-300">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-[10px] font-bold border-b border-slate-200 uppercase">
                      <th className="text-left pb-1.5 font-bold">Item</th>
                      <th className="text-center pb-1.5 w-10 font-bold">Qty</th>
                      <th className="text-right pb-1.5 w-20 font-bold">Price</th>
                      <th className="text-right pb-1.5 w-20 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-100">
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx} className="leading-snug">
                        <td className="py-2 text-slate-800 font-medium">{item.itemName}</td>
                        <td className="py-2 text-center text-slate-600 font-mono font-semibold">{item.quantity}</td>
                        <td className="py-2 text-right text-slate-500 font-mono">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-right font-bold text-slate-900 font-mono">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-black pt-2 border-t-2 border-slate-900 tracking-wide">
                  <span className="font-black text-black text-lg">GRAND TOTAL</span>
                  <span className="text-black font-black text-lg font-mono">{formatCurrency(selectedSale.grandTotal)}</span>
                </div>
                <div className="text-center pt-3 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-slate-700 font-medium">
                    {getPaymentIcon(selectedSale.paymentMethod)}
                    Paid by {selectedSale.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="pt-5 flex gap-2.5 no-print">
                <button
                  onClick={() => printThermalReceipt(selectedSale)}
                  className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Bill
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
