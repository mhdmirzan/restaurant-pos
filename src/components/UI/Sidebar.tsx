'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Store,
  ShoppingCart,
  Receipt,
  Utensils,
  LayoutDashboard,
  Menu as MenuIcon,
  X,
} from 'lucide-react';

const navItems = [
  {
    href: '/',
    label: 'POS Register',
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    href: '/sales',
    label: 'Sales History',
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    href: '/menu',
    label: 'Menu Management',
    icon: <Utensils className="w-4 h-4" />,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 text-white flex items-center justify-between px-4 h-14 border-b border-slate-700 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-100 flex items-center justify-center border border-slate-600">
            <Store className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-100">Food Corner</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile nav drawer */}
      <div
        className={`lg:hidden fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-60 bg-slate-800 text-white border-r border-slate-700 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1.5 p-3 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-800 text-white border-r border-slate-700 shrink-0">
        <div className="px-5 py-5 border-b border-slate-700 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-100 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-100">Food Corner</h1>
            <p className="text-[11px] text-slate-400 font-medium">Point of Sale</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3 flex-1 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 text-[11px] text-slate-400 font-medium flex items-center justify-between">
          <span>Food Corner POS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 border border-slate-600 text-slate-300">v1.0</span>
        </div>
      </aside>
    </>
  );
}
