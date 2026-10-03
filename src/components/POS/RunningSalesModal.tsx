'use client';

import { useState } from 'react';
import { RunningSaleType } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import {
  Clock,
  X,
  Search,
  Trash2,
  Printer,
  ArrowRightCircle,
  Receipt,
  UtensilsCrossed,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface RunningSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  runningSales: RunningSaleType[];
  onResumeSale: (sale: RunningSaleType) => void;
  onDeleteSale: (id: string) => void;
  onRefresh: () => void;
  onPrintTicket?: (sale: RunningSaleType) => void;
}

export default function RunningSalesModal({
  isOpen,
  onClose,
  runningSales,
  onResumeSale,
  onDeleteSale,
  onRefresh,
  onPrintTicket,
}: RunningSalesModalProps) {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = runningSales.filter((rs) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (rs.customerOrTable && rs.customerOrTable.toLowerCase().includes(q)) ||
      (rs.orderNumber && rs.orderNumber.toLowerCase().includes(q)) ||
      rs.items.some((i) => (i.name || i.itemName || '').toLowerCase().includes(q))
    );
  });

  const totalRunningAmount = runningSales.reduce((sum, rs) => sum + (rs.grandTotal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] max-h-[85vh] overflow-hidden border border-border flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900">Running Sales & Tabs</h2>
                <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {runningSales.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders on hold waiting for later billing • Total running: <span className="font-mono font-bold text-slate-800">{formatCurrency(totalRunningAmount)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              title="Refresh running orders"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search */}
        <div className="px-5 py-3 border-b border-border bg-white flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by table #, customer name, order number, or food item..."
              className="w-full pl-8.5 pr-8 py-2 bg-slate-50 border border-border rounded-xl text-xs focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {runningSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-border shadow-2xs flex items-center justify-center text-slate-400 mb-3">
                <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Running Sales</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Add food items to an order in the POS and click <strong>&quot;Hold as Running Sale&quot;</strong> to park bills for later settlement.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No running sales match &quot;{search}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((rs) => {
                const totalItemsCount = rs.items.reduce((sum, item) => sum + item.quantity, 0);
                const isConfirming = confirmDeleteId === rs._id;

                return (
                  <div
                    key={rs._id}
                    className="bg-white rounded-xl border border-border shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Card Top */}
                    <div className="p-4 border-b border-border/80 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {rs.orderNumber}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 truncate flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{rs.customerOrTable || 'Unnamed Tab'}</span>
                            </h3>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                            <span>Started: {formatDate(rs.createdAt)} at {formatTime(rs.createdAt)}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-extrabold text-slate-900 font-mono block">
                            {formatCurrency(rs.grandTotal)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Items preview */}
                    <div className="p-3.5 bg-slate-50/50 flex-1 max-h-40 overflow-y-auto">
                      <div className="space-y-1.5 text-xs">
                        {rs.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="font-mono font-bold text-slate-700 bg-white border border-slate-200 text-[10px] w-5 h-5 rounded flex items-center justify-center shrink-0">
                                {item.quantity}
                              </span>
                              <span className="text-slate-800 font-medium truncate">
                                {item.itemName || item.name}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-slate-900 shrink-0">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 bg-white border-t border-border flex items-center justify-between gap-2">
                      {isConfirming ? (
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xs text-rose-600 font-semibold flex-1">Cancel this tab?</span>
                          <button
                            onClick={() => {
                              onDeleteSale(rs._id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Yes, Cancel
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirmDeleteId(rs._id)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors text-xs"
                              title="Delete/Cancel tab"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {onPrintTicket && (
                              <button
                                onClick={() => onPrintTicket(rs)}
                                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                                title="Print order ticket"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              onResumeSale(rs);
                              onClose();
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ml-auto"
                          >
                            <ArrowRightCircle className="w-4 h-4" />
                            <span>Resume / Bill</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Click <strong>&quot;Resume / Bill&quot;</strong> on any tab to bring it back to the POS register for payment or additional items.</span>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-1.5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
