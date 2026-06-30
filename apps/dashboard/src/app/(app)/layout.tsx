'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuthStore } from '../../store/auth.store';
import { connectSocket } from '../../lib/socket';
import { useOrdersStore } from '../../store/orders.store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, restaurant } = useAuthStore();
  const { addOrder, updateOrder } = useOrdersStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !restaurant) {
      router.replace('/login');
      return;
    }

    // Connect WebSocket
    const socket = connectSocket(restaurant.id);

    socket.on('order:new', ({ order }) => {
      addOrder(order);
      // Play notification sound
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    socket.on('order:updated', ({ orderId, status, order }) => {
      updateOrder(orderId, order || { status });
    });

    return () => {
      socket.off('order:new');
      socket.off('order:updated');
    };
  }, [hydrated, user, restaurant]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a]">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
