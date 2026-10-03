'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuItemType, CartItem, PaymentMethod, SaleType, RunningSaleType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import MenuGrid from '@/components/POS/MenuGrid';
import BillPanel from '@/components/POS/BillPanel';
import RunningSalesModal from '@/components/POS/RunningSalesModal';
import { printRunningTicket } from '@/lib/printReceipt';
import {
  Store,
  Clock,
  Database,
  Plus,
  Search,
  X,
  Receipt,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export default function POSPage() {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [customerOrTable, setCustomerOrTable] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedBillNumber, setSavedBillNumber] = useState('');
  const [savedSale, setSavedSale] = useState<SaleType | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBillMobile, setShowBillMobile] = useState(false);

  // Running Sales states
  const [runningSales, setRunningSales] = useState<RunningSaleType[]>([]);
  const [showRunningSalesModal, setShowRunningSalesModal] = useState(false);
  const [activeRunningSale, setActiveRunningSale] = useState<RunningSaleType | null>(null);
  const [holdingRunningSale, setHoldingRunningSale] = useState(false);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load menu items
  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data.filter((item: MenuItemType) => item.active));
      }
    } catch {
      setErrorMessage('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check DB health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setDbStatus(res.ok ? 'connected' : 'disconnected');
      } catch {
        setDbStatus('disconnected');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Add item to cart
  const addToCart = (item: MenuItemType) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item._id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item._id
            ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.price }
            : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          total: item.price,
        },
      ];
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Update quantity
  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menuItemId === menuItemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            return { ...c, quantity: newQty, total: newQty * c.price };
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Load running sales
  const loadRunningSales = useCallback(async () => {
    try {
      const res = await fetch('/api/running-sales');
      if (res.ok) {
        const data = await res.json();
        setRunningSales(data.runningSales || []);
      }
    } catch {
      console.warn('Failed to load running sales');
    }
  }, []);

  useEffect(() => {
    loadRunningSales();
    const interval = setInterval(loadRunningSales, 15000);
    return () => clearInterval(interval);
  }, [loadRunningSales]);

  // Remove item
  const removeItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // New bill
  const handleNewBill = () => {
    setCart([]);
    setPaymentMethod('');
    setCustomerOrTable('');
    setDiscount(0);
    setSuccessMessage('');
    setErrorMessage('');
    setSavedBillNumber('');
    setSavedSale(null);
    setShowBillMobile(false);
    setActiveRunningSale(null);
  };

  // Hold or Update Running Sale
  const handleHoldRunningSale = async () => {
    if (holdingRunningSale) return;
    if (cart.length === 0) {
      setErrorMessage('Please add items to hold as a running sale');
      return;
    }

    setHoldingRunningSale(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/running-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRunningSale?._id,
          customerOrTable: customerOrTable.trim() || 'Table Order',
          discount,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const isUpdate = !!activeRunningSale;
        setSuccessMessage(
          isUpdate
            ? `Running tab updated: ${data.runningSale.orderNumber} (${data.runningSale.customerOrTable})`
            : `Saved to Running Sales: ${data.runningSale.orderNumber} (${data.runningSale.customerOrTable})`
        );
        // Clear current active cart so cashier can start next customer
        setCart([]);
        setPaymentMethod('');
        setCustomerOrTable('');
        setDiscount(0);
        setActiveRunningSale(null);
        await loadRunningSales();
      } else {
        setErrorMessage(data.error || 'Failed to save running sale');
      }
    } catch {
      setErrorMessage('Network error while saving running sale');
    } finally {
      setHoldingRunningSale(false);
    }
  };

  // Resume a running sale into POS cart
  const handleResumeRunningSale = (sale: RunningSaleType) => {
    const restoredCart: CartItem[] = (sale.items || []).map((item) => ({
      menuItemId: item.menuItemId,
      name: item.itemName || item.name || 'Item',
      price: item.price,
      quantity: item.quantity,
      total: item.total || item.price * item.quantity,
    }));

    setCart(restoredCart);
    setCustomerOrTable(sale.customerOrTable || '');
    setDiscount(sale.discount || 0);
    setPaymentMethod('');
    setActiveRunningSale(sale);
    setErrorMessage('');
    setSuccessMessage('');
    setSavedSale(null);
    setSavedBillNumber('');
    setShowBillMobile(true);
  };

  // Delete a running tab
  const handleDeleteRunningSale = async (id: string) => {
    try {
      const res = await fetch(`/api/running-sales?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRunningSales((prev) => prev.filter((r) => r._id !== id));
        if (activeRunningSale?._id === id) {
          setActiveRunningSale(null);
        }
      }
    } catch (e) {
      console.error('Failed to delete running sale', e);
    }
  };

  // Save sale
  const handleSaveSale = async () => {
    if (saving) return;
    if (cart.length === 0) {
      setErrorMessage('Please add items to the bill');
      return;
    }
    if (!paymentMethod) {
      setErrorMessage('Please select a payment method');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
          })),
          paymentMethod,
          customerOrTable,
          discount,
          runningSaleId: activeRunningSale?._id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Sale saved successfully');
        setSavedBillNumber(data.sale.billNumber);
        setSavedSale(data.sale);
        setCart([]);
        setPaymentMethod('');
        setCustomerOrTable('');
        setDiscount(0);
        setActiveRunningSale(null);
        loadRunningSales();
      } else {
        setErrorMessage(data.error || 'Failed to save sale');
      }
    } catch {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get categories dynamically from active menu
  const availableCategories = useMemo(() => {
    const present = new Set<string>();
    menuItems.forEach((item) => {
      if (item.category) present.add(item.category);
    });
    return ['All', ...Array.from(present)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading Food Corner POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen lg:pt-0 pt-14 bg-background">
      {/* Top Header */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white shadow-2xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Food Corner POS</h2>
              <p className="text-[11px] text-slate-400 font-medium">Register #1</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pl-3 border-l border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
            dbStatus === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            dbStatus === 'disconnected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Database className="w-3 h-3" />
            <span>{dbStatus === 'connected' ? 'Connected' : dbStatus === 'disconnected' ? 'DB Error' : 'Checking...'}</span>
          </div>

          {/* Running Sales button beside New Bill button */}
          <button
            onClick={() => setShowRunningSalesModal(true)}
            className="relative bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
            title="View open running tabs"
          >
            <Clock className="w-3.5 h-3.5 text-slate-700" />
            <span>Running Sales</span>
            {runningSales.length > 0 && (
              <span className="bg-slate-800 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {runningSales.length}
              </span>
            )}
          </button>

          <button
            onClick={handleNewBill}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Bill
          </button>
        </div>
      </header>

      {/* Mobile bill floating toggle */}
      {cart.length > 0 && !showBillMobile && (
        <button
          onClick={() => setShowBillMobile(true)}
          className="lg:hidden sticky top-14 z-30 bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-lg"
        >
          <span className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            View Bill ({cart.reduce((s, i) => s + i.quantity, 0)} items)
          </span>
          <span className="font-bold flex items-center gap-1">
            {formatCurrency(grandTotal)}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Food Menu Area */}
        <div className={`flex-1 flex flex-col overflow-hidden p-4 sm:p-5 ${showBillMobile ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search & Category Filter Toolbar */}
          <div className="space-y-3 mb-4 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food item (e.g. Chicken Rice, Biryani, Kothu)..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 shadow-2xs transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-auto pr-1">
            <MenuGrid
              items={filteredItems}
              onAddItem={addToCart}
            />
          </div>
        </div>

        {/* Right: Bill & Checkout Panel */}
        <div className={`w-full lg:w-[500px] xl:w-[560px] 2xl:w-[600px] border-l border-border bg-white flex flex-col shrink-0 ${
          showBillMobile ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Mobile Back to Menu */}
          {showBillMobile && (
            <button
              onClick={() => setShowBillMobile(false)}
              className="lg:hidden w-full px-4 py-2.5 bg-slate-50 border-b border-border text-xs text-slate-700 font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Food Menu
            </button>
          )}

          <BillPanel
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            grandTotal={grandTotal}
            paymentMethod={paymentMethod}
            customerOrTable={customerOrTable}
            saving={saving}
            successMessage={successMessage}
            errorMessage={errorMessage}
            savedBillNumber={savedBillNumber}
            savedSale={savedSale}
            activeRunningSale={activeRunningSale}
            holdingRunningSale={holdingRunningSale}
            onHoldRunningSale={handleHoldRunningSale}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onSetDiscount={setDiscount}
            onSetPaymentMethod={setPaymentMethod}
            onSetCustomerOrTable={setCustomerOrTable}
            onSaveSale={handleSaveSale}
            onNewBill={handleNewBill}
          />
        </div>
      </div>

      {/* Running Sales Modal */}
      <RunningSalesModal
        isOpen={showRunningSalesModal}
        onClose={() => setShowRunningSalesModal(false)}
        runningSales={runningSales}
        onResumeSale={handleResumeRunningSale}
        onDeleteSale={handleDeleteRunningSale}
        onRefresh={loadRunningSales}
        onPrintTicket={printRunningTicket}
      />
    </div>
  );
}
