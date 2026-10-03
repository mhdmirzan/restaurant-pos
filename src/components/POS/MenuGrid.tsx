'use client';

import { MenuItemType } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Utensils,
  Soup,
  Flame,
  Sandwich,
  Coffee,
  Pizza,
  Cake,
  Beef,
  Plus,
} from 'lucide-react';

interface MenuGridProps {
  items: MenuItemType[];
  onAddItem: (item: MenuItemType) => void;
}

function getCategoryIcon(category: string) {
  const lower = (category || '').toLowerCase();
  const iconClass = "w-3.5 h-3.5 text-slate-600";
  if (lower.includes('rice') || lower.includes('biryani')) {
    return <Soup className={iconClass} />;
  }
  if (lower.includes('kothu') || lower.includes('spicy') || lower.includes('grill')) {
    return <Flame className={iconClass} />;
  }
  if (lower.includes('sub') || lower.includes('sandwich') || lower.includes('burger')) {
    return <Sandwich className={iconClass} />;
  }
  if (lower.includes('chicken') || lower.includes('beef') || lower.includes('meat')) {
    return <Beef className={iconClass} />;
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
    return <Coffee className={iconClass} />;
  }
  if (lower.includes('pizza')) {
    return <Pizza className={iconClass} />;
  }
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sweet') || lower.includes('ice')) {
    return <Cake className={iconClass} />;
  }
  return <Utensils className={iconClass} />;
}

export default function MenuGrid({ items, onAddItem }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
        <Utensils className="w-7 h-7 mb-2 opacity-40 text-slate-400" />
        <p>No menu items found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2.5">
      {items.map((item) => (
        <button
          key={item._id}
          onClick={() => onAddItem(item)}
          className="bg-white border border-border rounded-xl p-2.5 text-left hover:border-slate-400 hover:shadow-2xs transition-all active:scale-[0.98] group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                {getCategoryIcon(item.category)}
              </div>
              <span className="w-5 h-5 rounded-full bg-slate-50 text-slate-400 group-hover:bg-slate-700 group-hover:text-white flex items-center justify-center transition-colors">
                <Plus className="w-3 h-3" />
              </span>
            </div>

            <h3 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1 group-hover:text-slate-900 transition-colors" title={item.name}>
              {item.name}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[65px]">
              {item.category}
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {item.price > 0 ? formatCurrency(item.price) : 'No price'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
