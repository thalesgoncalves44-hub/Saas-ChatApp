'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { connectSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../store/auth.store';
import { ChefHat, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function KitchenPage() {
  const { restaurant } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadKitchenOrders();
    if (restaurant) {
      const socket = connectSocket(restaurant.id);
      socket.on('order:new', ({ order }) => {
        if (['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)) {
          setOrders((prev) => [order, ...prev]);
        }
      });
      socket.on('order:updated', ({ order }) => {
        setOrders((prev) => {
          if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
            return prev.filter((o) => o.id !== order.id);
          }
          return prev.map((o) => (o.id === order.id ? order : o));
        });
      });
    }
    return () => {};
  }, [restaurant]);

  const loadKitchenOrders = async () => {
    const { data } = await api.get('/orders', { params: { status: 'PREPARING' } });
    const confirmed = await api.get('/orders', { params: { status: 'CONFIRMED' } });
    setOrders([...data, ...confirmed.data]);
  };

  const handleAdvance = async (orderId: string, status: string) => {
    setUpdating(orderId);
    await api.patch(`/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat size={32} className="text-[#FF6B00]" />
          <h1 className="text-2xl font-bold">KDS - Cozinha</h1>
        </div>
        <div className="text-gray-400 text-sm">{new Date().toLocaleTimeString('pt-BR')}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => {
          const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
          const isUrgent = elapsed > 20;
          return (
            <div
              key={order.id}
              className={cn('rounded-xl p-4 border-2', {
                'bg-yellow-900/20 border-yellow-500': order.status === 'PENDING',
                'bg-blue-900/20 border-blue-500': order.status === 'CONFIRMED',
                'bg-orange-900/20 border-orange-500': order.status === 'PREPARING',
                'border-red-500 bg-red-900/20': isUrgent,
              })}
            >
              <div className="flex justify-between mb-2">
                <span className="text-xl font-black">#{order.orderNumber}</span>
                <div className={cn('flex items-center gap-1 text-sm', isUrgent ? 'text-red-400' : 'text-gray-400')}>
                  <Clock size={14} />
                  {elapsed}min
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                {order.type === 'DINE_IN' ? `Mesa: ${order.table?.name || '-'}` : order.type === 'TAKEAWAY' ? 'Retirada' : 'Entrega'}
              </p>
              <div className="space-y-1 mb-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="text-sm">
                    <span className="font-bold text-white">{item.quantity}x</span>
                    <span className="ml-1 text-gray-300">{item.name}</span>
                    {item.notes && <p className="text-xs text-yellow-400 ml-4">Obs: {item.notes}</p>}
                    {item.options?.map((opt: any) => (
                      <p key={opt.id} className="text-xs text-gray-500 ml-4">- {opt.name}</p>
                    ))}
                    {item.addons?.map((addon: any) => (
                      <p key={addon.id} className="text-xs text-gray-500 ml-4">+ {addon.name}</p>
                    ))}
                  </div>
                ))}
              </div>
              {order.notes && (
                <p className="text-sm text-yellow-300 bg-yellow-900/20 rounded p-2 mb-3">
                  Obs: {order.notes}
                </p>
              )}
              <div className="flex gap-2">
                {order.status === 'CONFIRMED' && (
                  <Button size="sm" className="flex-1 text-xs" onClick={() => handleAdvance(order.id, 'PREPARING')} loading={updating === order.id}>
                    Iniciar Preparo
                  </Button>
                )}
                {order.status === 'PREPARING' && (
                  <Button size="sm" className="flex-1 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleAdvance(order.id, 'READY')} loading={updating === order.id}>
                    Pronto!
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="col-span-full text-center py-24 text-gray-600">
            <ChefHat size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-xl">Nenhum pedido na fila</p>
          </div>
        )}
      </div>
    </div>
  );
}
