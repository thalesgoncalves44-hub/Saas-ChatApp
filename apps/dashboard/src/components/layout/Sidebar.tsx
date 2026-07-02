'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, Users,
  Tag, Megaphone, Wallet, Package, Settings, LogOut, Zap,
  Table, ChefHat, Smartphone, Bell, Star,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pedidos', href: '/orders', icon: ShoppingBag },
  { label: 'Cardápio', href: '/menu', icon: UtensilsCrossed },
  { label: 'Mesas', href: '/tables', icon: Table },
  { label: 'Clientes', href: '/customers', icon: Users },
  { label: 'Avaliações', href: '/reviews', icon: Star },
  { label: 'Cupons', href: '/coupons', icon: Tag },
  { label: 'Campanhas', href: '/campaigns', icon: Megaphone },
  { label: 'Financeiro', href: '/finance', icon: Wallet },
  { label: 'Estoque', href: '/stock', icon: Package },
  { label: 'Relatórios', href: '/reports', icon: BarChart3 },
];

const kitchenItems = [
  { label: 'Cozinha (KDS)', href: '/kitchen', icon: ChefHat },
  { label: 'Garçom', href: '/waiter', icon: Smartphone },
];

const settingsItems = [
  { label: 'Configurações', href: '/settings/restaurant', icon: Settings },
];

interface NavItemProps {
  href: string;
  icon: any;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20'
          : 'text-gray-400 hover:text-white hover:bg-[#1e1e35]',
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { restaurant, logout } = useAuthStore();

  return (
    <aside className="w-64 min-h-screen bg-[#0d0d1a] border-r border-[#2d2d4f] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2d2d4f]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B00] rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">ZappAI</span>
        </div>
        {restaurant && (
          <p className="text-xs text-gray-500 mt-2 truncate">{restaurant.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-[#2d2d4f] mt-4">
          <p className="text-xs text-gray-600 px-3 mb-2 uppercase tracking-wider">Operações</p>
          {kitchenItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-[#2d2d4f] mt-4">
          {settingsItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname.startsWith('/settings')}
            />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[#2d2d4f]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
