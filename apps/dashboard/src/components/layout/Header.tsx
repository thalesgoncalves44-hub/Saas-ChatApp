'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Power } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { restaurant, updateRestaurant } = useAuthStore();
  const [notifCount, setNotifCount] = useState(0);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    api.get('/notifications/unread-count')
      .then(({ data }) => setNotifCount(typeof data === 'number' ? data : data.count || 0))
      .catch(() => {});
  }, []);

  const handleToggleOpen = async () => {
    if (!restaurant) return;
    setToggling(true);
    try {
      const { data } = await api.patch('/restaurant/toggle-open');
      updateRestaurant({ isOpen: data.isOpen });
    } finally {
      setToggling(false);
    }
  };

  return (
    <header className="bg-[#0d0d1a] border-b border-[#2d2d4f] h-16 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Restaurant Open/Close Toggle */}
        {restaurant && (
          <button
            onClick={handleToggleOpen}
            disabled={toggling}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              restaurant.isOpen
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
            )}
          >
            <Power size={14} />
            {restaurant.isOpen ? 'Aberto' : 'Fechado'}
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-[#1e1e35] text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6B00] rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-9 h-9 bg-[#FF6B00] rounded-full flex items-center justify-center text-white text-sm font-bold">
          {restaurant?.name?.[0] || 'Z'}
        </div>
      </div>
    </header>
  );
}
