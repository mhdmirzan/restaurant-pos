'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuItemType, CategoryType, CATEGORIES } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  CheckCircle2,
  FolderTree,
  Coins,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Tags,
  AlertTriangle,
  Utensils,
  Soup,
  Flame,
  Sandwich,
  Coffee,
  Pizza,
  Cake,
  Beef,
  Lock,
} from 'lucide-react';

function getCategoryIcon(category: string) {
  const lower = (category || '').toLowerCase();
  if (lower.includes('rice') || lower.includes('biryani')) {
    return <Soup className="w-4 h-4 text-slate-600" />;
  }
  if (lower.includes('kothu') || lower.includes('spicy') || lower.includes('grill')) {
    return <Flame className="w-4 h-4 text-slate-600" />;
  }
  if (lower.includes('sub') || lower.includes('sandwich') || lower.includes('burger')) {
    return <Sandwich className="w-4 h-4 text-slate-600" />;
  }
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('meat')) {
    return <Beef className="w-4 h-4 text-slate-600" />;
  }
  if (
    lower.includes('beverage') ||
    lower.includes('drink') ||
    lower.includes('juice') ||
    lower.includes('tea') ||
    lower.includes('coffee') ||
    lower.includes('cola') ||
    lower.includes('water')
  ) {
    return <Coffee className="w-4 h-4 text-slate-600" />;
  }
  if (lower.includes('pizza')) {
    return <Pizza className="w-4 h-4 text-slate-600" />;
  }
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sweet') || lower.includes('ice')) {
    return <Cake className="w-4 h-4 text-slate-600" />;
  }
  return <Utensils className="w-4 h-4 text-slate-600" />;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItemType | null>(null);

  // Loading states
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItemState, setDeletingItemState] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'category'>('category');

  // Menu Item Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formPrice, setFormPrice] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Category Form state
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ id: number; type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  }, []);

  // Fetch Categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data: CategoryType[] = await res.json();
        setCategories(data);
        if (!formCategory && data.length > 0) {
          setFormCategory(data[0].name);
        }
      }
    } catch {
      console.error('Failed to load categories');
    }
  }, [formCategory]);

  // Fetch Menu Items
  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast('error', errorData.error || 'Failed to load menu items');
      }
    } catch {
      showToast('error', 'Network error: could not connect to server');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
    loadItems();
  }, [loadCategories, loadItems]);

  // Item Form Handlers
  const resetItemForm = () => {
    setFormName('');
    setFormCategory(categories.length > 0 ? categories[0].name : CATEGORIES[0]);
    setFormPrice('');
    setFormActive(true);
    setFormError('');
    setEditingItem(null);
    setShowItemModal(false);
  };

  const handleOpenAdd = () => {
    resetItemForm();
    setShowItemModal(true);
  };

  const handleEdit = (item: MenuItemType) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(String(item.price));
    setFormActive(item.active);
    setFormError('');
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingItem) return;

    const trimmedName = formName.trim();
    const priceNum = Number(formPrice);

    if (!trimmedName) {
      setFormError('Item name is required');
      return;
    }
    if (!formCategory) {
      setFormError('Please select or create a category');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price (greater than or equal to 0)');
      return;
    }

    setSavingItem(true);
    setFormError('');

    try {
      const payload = {
        name: trimmedName,
        category: formCategory,
        price: priceNum,
        active: formActive,
      };

      const url = editingItem ? `/api/menu/${editingItem._id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          'success',
          editingItem ? `"${trimmedName}" updated successfully` : `"${trimmedName}" added to menu`
        );
        resetItemForm();
        await loadItems();
        await loadCategories();
      } else {
        setFormError(data.error || 'Failed to save menu item');
      }
    } catch {
      setFormError('Network error while saving. Please try again.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleActive = async (item: MenuItemType) => {
    if (togglingId) return;
    setTogglingId(item._id);

    try {
      const nextActiveState = !item.active;
      const res = await fetch(`/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          price: item.price,
          active: nextActiveState,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, active: nextActiveState } : i))
        );
        showToast(
          'success',
          `${item.name} is now ${nextActiveState ? 'active on POS' : 'hidden from POS'}`
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast('error', errorData.error || 'Failed to update item status');
      }
    } catch {
      showToast('error', 'Network error updating item status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteItemConfirm = async () => {
    if (!deletingItem || deletingItemState) return;
    setDeletingItemState(true);

    try {
      const res = await fetch(`/api/menu/${deletingItem._id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setItems((prev) => prev.filter((i) => i._id !== deletingItem._id));
        showToast('success', `"${deletingItem.name}" deleted from menu`);
        setDeletingItem(null);
        await loadCategories();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast('error', data.error || 'Failed to delete menu item');
      }
    } catch {
      showToast('error', 'Network error while deleting item');
    } finally {
      setDeletingItemState(false);
    }
  };

  // Category Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingCategory) return;

    const trimmed = newCatName.trim();
    if (!trimmed) {
      setCatError('Category name cannot be empty');
      return;
    }

    setSavingCategory(true);
    setCatError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', `Category "${trimmed}" created successfully`);
        setNewCatName('');
        await loadCategories();
      } else {
        setCatError(data.error || 'Failed to create category');
      }
    } catch {
      setCatError('Network error creating category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: CategoryType) => {
    if (deletingCategoryId) return;

    if ((category.itemCount || 0) > 0) {
      showToast(
        'error',
        `Cannot remove "${category.name}": ${category.itemCount} item(s) are assigned to it.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to remove the category "${category.name}"?`)) {
      return;
    }

    setDeletingCategoryId(category._id);

    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', `Category "${category.name}" removed successfully`);
        if (selectedCategory === category.name) {
          setSelectedCategory('All');
        }
        await loadCategories();
      } else {
        showToast('error', data.error || 'Failed to delete category');
      }
    } catch {
      showToast('error', 'Network error deleting category');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesCategory = item.category.toLowerCase().includes(q);
          if (!matchesName && !matchesCategory) return false;
        }
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }
        if (statusFilter === 'active' && !item.active) return false;
        if (statusFilter === 'inactive' && item.active) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
  }, [items, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Summary statistics
  const totalCount = items.length;
  const activeCount = items.filter((i) => i.active).length;
  const avgPrice = totalCount > 0 ? Math.round(items.reduce((s, i) => s + i.price, 0) / totalCount) : 0;

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    categories.forEach((c) => {
      counts[c.name] = items.filter((i) => i.category === c.name).length;
    });
    return counts;
  }, [items, categories]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-medium">Loading Food Corner Menu...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pt-18 lg:pt-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-md border text-xs font-semibold transition-all transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Menu Management</h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-slate-200">
              Food Corner
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create food items, set fixed prices, and organize categories for POS checkout.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Manage Categories CTA */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all active:scale-[0.98]"
          >
            <Tags className="w-3.5 h-3.5 text-slate-500" />
            Categories ({categories.length})
          </button>

          {/* Add Menu Item CTA */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{totalCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">In database</span>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active on POS</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2">{activeCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ready to order</span>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-800 mt-2">{categories.length}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Customizable</span>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Price</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{formatCurrency(avgPrice)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across all items</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-border rounded-xl p-4 mb-6 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food item name or category..."
              className="w-full pl-9 pr-8 py-2 border border-border rounded-lg text-xs focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 bg-slate-50/50 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-border rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price-asc' | 'price-desc' | 'category')}
              className="px-3 py-2 border border-border rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:border-slate-600"
            >
              <option value="category">Sort by Category</option>
              <option value="name">Sort by Name (A-Z)</option>
              <option value="price-asc">Price (Low → High)</option>
              <option value="price-desc">Price (High → Low)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1 border-t border-border items-center">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedCategory === 'All'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {categoryCounts['All'] || 0}
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {categoryCounts[cat.name] || 0}
              </span>
            </button>
          ))}

          {/* Quick add category button in pills row */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-dashed border-slate-300 flex items-center gap-1 whitespace-nowrap"
            title="Add or remove categories"
          >
            <Plus className="w-3 h-3" />
            <span>Category</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-border text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Food Item</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Fixed Price (Rs.)</th>
                <th className="px-5 py-3 text-center">POS Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr
                  key={item._id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    !item.active ? 'bg-slate-50/40 text-slate-400' : ''
                  }`}
                >
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <p className={`font-semibold text-xs ${item.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {item._id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                      {item.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-bold ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>
                      {formatCurrency(item.price)}
                    </span>
                  </td>

                  {/* Active Toggle */}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(item)}
                      disabled={togglingId === item._id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all border ${
                        item.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                      title={item.active ? 'Click to hide from POS' : 'Click to show in POS'}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {togglingId === item._id ? 'Updating...' : item.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        title="Edit item details"
                      >
                        <Pencil className="w-3 h-3 text-slate-500" />
                        Edit
                      </button>

                      <button
                        onClick={() => setDeletingItem(item)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                        title="Delete item from menu"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Utensils className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-semibold text-slate-800">No menu items found</h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {searchQuery || selectedCategory !== 'All' || statusFilter !== 'all'
                          ? 'Try adjusting your search terms or filters.'
                          : 'Your menu is currently empty.'}
                      </p>
                      <div className="mt-3 flex justify-center gap-2">
                        {searchQuery || selectedCategory !== 'All' || statusFilter !== 'all' ? (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('All');
                              setStatusFilter('all');
                            }}
                            className="text-xs font-semibold text-slate-700 hover:underline"
                          >
                            Reset filters
                          </button>
                        ) : (
                          <button
                            onClick={handleOpenAdd}
                            className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add First Item
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Manage Categories</h2>
                  <p className="text-xs text-slate-500">Add or remove food categories</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCatError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {catError && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <div className="p-5 space-y-5">
              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Category</h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Enter category name (e.g. Desserts, Burgers)..."
                    className="flex-1 px-3 py-2 border border-border rounded-xl text-xs bg-white focus:outline-none focus:border-slate-600"
                    required
                  />

                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 shadow-2xs disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {savingCategory ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Existing Categories ({categories.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">Items assigned cannot be deleted</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {categories.map((cat) => {
                    const count = cat.itemCount || 0;
                    const isDeleting = deletingCategoryId === cat._id;

                    return (
                      <div
                        key={cat._id}
                        className="flex items-center justify-between p-2.5 bg-white border border-border rounded-xl hover:border-slate-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            {getCategoryIcon(cat.name)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{cat.name}</p>
                            <span className="text-[10px] text-slate-400">
                              {count} {count === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {count > 0 ? (
                            <span
                              className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 cursor-not-allowed"
                              title={`${count} items are currently assigned. Reassign items first to delete.`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              In Use
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              disabled={isDeleting}
                              className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                              title="Delete unused category"
                            >
                              <Trash2 className="w-3 h-3" />
                              {isDeleting ? 'Deleting...' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close footer */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-border overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  {editingItem ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {editingItem ? 'Update pricing or category' : 'Item will be available for POS orders'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetItemForm}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleItemSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Item Name <span className="text-slate-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 text-xs bg-white"
                  placeholder="e.g. Chicken Fried Rice - Regular"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Category <span className="text-slate-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                    >
                      + Manage
                    </button>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 text-xs bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Price (Rs.) <span className="text-slate-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                      Rs.
                    </span>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full pl-11 pr-3 py-2 border border-border rounded-xl focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 text-xs font-semibold"
                      placeholder="0"
                      min="0"
                      step="any"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle Box */}
              <div className="pt-1">
                <div className="flex items-center justify-between p-3 bg-slate-50/70 border border-border rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Available in POS</p>
                    <p className="text-[11px] text-slate-500">
                      Show this item on the cashier ordering screen
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-slate-700 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="flex-1 py-2 border border-border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex-1 bg-slate-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all disabled:opacity-50 shadow-2xs"
                >
                  {savingItem ? 'Saving...' : editingItem ? 'Update Item' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-border p-5 text-center">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Menu Item?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{deletingItem.name}&quot;</span>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={deletingItemState}
                className="flex-1 py-2 border border-border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItemConfirm}
                disabled={deletingItemState}
                className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-50 shadow-2xs"
              >
                {deletingItemState ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
