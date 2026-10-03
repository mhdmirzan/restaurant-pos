'use client';

import { useState, useEffect } from 'react';
import { SaleType, DashboardDataType } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { printThermalReceipt } from '@/lib/printReceipt';
import SalesLineChart from '@/components/Dashboard/SalesLineChart';
import {
  LayoutDashboard,
  Coins,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Clock,
  Award,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,
  X,
  Printer,
  ChevronRight,
  Store,
  User,
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardDataType | null>(null);
  const [loading, setLoading] = useState(true);

  // Recent Sales Modal state
  const [showRecentSalesModal, setShowRecentSalesModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleType | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.recentSales && json.recentSales.length > 0) {
            setSelectedSale(json.recentSales[0]);
          }
        }
      } catch {
        console.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500 text-sm">Failed to load dashboard</p>
      </div>
    );
  }

  const maxQuantity = data.topItems.length > 0 ? data.topItems[0].totalQuantity : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pt-18 lg:pt-8">
      {/* Header with Single Button for Recent Sales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-slate-700" />
            Dashboard & Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time snapshot of sales performance, order volume, and revenue analytics
          </p>
        </div>

        {/* Single Button for Recent Sales Modal */}
        <button
          onClick={() => {
            if (data.recentSales.length > 0 && !selectedSale) {
              setSelectedSale(data.recentSales[0]);
            }
            setShowRecentSalesModal(true);
          }}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 shrink-0"
        >
          <Clock className="w-4 h-4 text-slate-300" />
          <span>Recent Sales</span>
          <span className="bg-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-600 text-slate-200">
            {data.recentSales.length}
          </span>
        </button>
      </div>

      {/* Stats Cards (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Today&apos;s Sales</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(data.todaySales)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Today&apos;s Bills</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{data.todayBills}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Items Sold</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{data.itemsSold}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Average Bill</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{formatCurrency(data.averageBill)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* LINE CHART: Time vs Sales (Week, Month, Year) - Right below KPIs and above Top Selling Items */}
      {data.salesChart && (
        <SalesLineChart salesChart={data.salesChart} />
      )}

      {/* Top Selling Items - Located below the Line Chart */}
      <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Top Selling Items
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Ranked by volume sold across all orders</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            {data.topItems.length} popular dishes
          </span>
        </div>

        <div className="p-5">
          {data.topItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No item sales recorded yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {data.topItems.map((item, index) => (
                <div key={item._id} className="bg-slate-50/60 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-2xs">
                        {index + 1}
                      </span>
                      {item._id}
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {item.totalQuantity} <span className="text-[10px] font-normal text-slate-500">sold</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-700 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${(item.totalQuantity / maxQuantity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL: Recent Sales with Bought Items on the Right */}
      {showRecentSalesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] max-h-[85vh] overflow-hidden border border-border flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">Recent Sales Activity</h2>
                  <p className="text-[11px] text-slate-500">
                    Sorted by time (newest first) • Click any bill to inspect bought items
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecentSalesModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Two-Column Split Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: List of Sales Sorted by Time */}
              <div className="w-full md:w-5/12 border-r border-border overflow-y-auto divide-y divide-slate-100 bg-white">
                <div className="p-3 bg-slate-50/50 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 backdrop-blur-xs">
                  <span>Completed Bills ({data.recentSales.length})</span>
                  <span>Select to view items</span>
                </div>

                {data.recentSales.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">No sales recorded yet</div>
                ) : (
                  data.recentSales.map((sale) => {
                    const isSelected = selectedSale?._id === sale._id;
                    return (
                      <button
                        key={sale._id}
                        onClick={() => setSelectedSale(sale)}
                        className={`w-full text-left p-3.5 transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-slate-100/90 border-l-4 border-slate-800 shadow-2xs'
                            : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono">{sale.billNumber}</span>
                            {sale.customerOrTable && (
                              <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[90px]">
                                {sale.customerOrTable}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                            <span>{formatTime(sale.createdAt)}</span>
                            <span>•</span>
                            <span>{formatDate(sale.saleDate)}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900 font-mono">
                              {formatCurrency(sale.grandTotal)}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 mt-0.5">
                              {getPaymentIcon(sale.paymentMethod)}
                              {sale.paymentMethod}
                            </span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-slate-800 translate-x-0.5' : 'text-slate-300'}`} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Bought Items for Selected Sale */}
              <div className="w-full md:w-7/12 flex-1 flex flex-col overflow-hidden bg-slate-50/40 p-5">
                {selectedSale ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Bill Header Info (Fixed at top) */}
                    <div className="bg-white p-4 rounded-xl border border-border shadow-2xs mb-3 shrink-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Information</span>
                          <h3 className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                            {selectedSale.billNumber}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(selectedSale.saleDate)} at {formatTime(selectedSale.createdAt)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-slate-700">
                            {getPaymentIcon(selectedSale.paymentMethod)}
                            {selectedSale.paymentMethod}
                          </span>
                          {selectedSale.customerOrTable && (
                            <p className="text-[11px] text-slate-600 font-medium mt-1">
                              Ref: {selectedSale.customerOrTable}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bought Items Table (Scrollable in middle) */}
                    <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden flex-1 flex flex-col min-h-0 mb-3">
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-border flex items-center justify-between shrink-0">
                        <span className="text-xs font-bold text-slate-700">
                          Bought Items ({(selectedSale.items || []).reduce((s, i) => s + i.quantity, 0)})
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">Line Items</span>
                      </div>

                      <div className="p-3 overflow-y-auto flex-1">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 text-[10px] font-bold uppercase border-b border-slate-200">
                              <th className="text-left pb-2 font-bold">Item Name</th>
                              <th className="text-center pb-2 w-12 font-bold">Qty</th>
                              <th className="text-right pb-2 w-24 font-bold">Unit Price</th>
                              <th className="text-right pb-2 w-24 font-bold">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(selectedSale.items || []).map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 text-slate-800 font-semibold">{item.itemName}</td>
                                <td className="py-2.5 text-center text-slate-700 font-mono font-bold">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 text-right text-slate-500 font-mono">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                                  {formatCurrency(item.total)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fixed Bottom: Grand Total right above the Print button */}
                    <div className="bg-white p-3.5 rounded-xl border border-border shadow-2xs shrink-0 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Grand Total</span>
                        <span className="text-lg font-extrabold text-slate-900 font-mono">
                          {formatCurrency(selectedSale.grandTotal)}
                        </span>
                      </div>

                      <button
                        onClick={() => printThermalReceipt(selectedSale)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-[0.99]"
                      >
                        <Printer className="w-4 h-4" />
                        Print Thermal Receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <Receipt className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">No bill selected</p>
                    <p className="text-xs text-slate-400 mt-1">Select an order on the left to inspect items</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
