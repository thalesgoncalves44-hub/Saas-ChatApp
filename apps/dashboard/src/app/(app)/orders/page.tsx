'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '../../../lib/utils';
import { cn } from '../../../lib/utils';
import api from '../../../lib/api';
import { useOrdersStore } from '../../../store/orders.store';
import { Plus, RefreshCw } from 'lucide-react';

const COLUMNS = [
  { status: 'PENDING', label: 'Pendentes', color: 'border-yellow-500' },
  { status: 'CONFIRMED', label: 'Confirmados', color: 'border-blue-500' },
  { status: 'PREPARING', label: 'Preparando', color: 'border-orange-500' },
  { status: 'READY', label: 'Prontos', color: 'border-green-500' },
  { status: 'DELIVERING', label: 'Em Entrega', color: 'border-purple-500' },
  { status: 'DELIVERED', label: 'Entregues', color: 'border-gray-500' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PREPARING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  READY: 'bg-green-500/20 text-green-400 border-green-500/30',
  DELIVERING: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DELIVERING',
  DELIVERING: 'DELIVERED',
};

export default function OrdersPage() {
  const { orders, fetchOrders, updateOrderStatus } = useOrdersStore();
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;

    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancelar este pedido?')) return;
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  };

  const getOrdersByStatus = (status: string) =>
    orders.filter((o) => o.status === status);

  return (
    <div className="flex flex-col h-screen">
      <Header title="Pedidos" subtitle="Kanban de pedidos em tempo real" />
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#2d2d4f]">
        <Button onClick={() => fetchOrders()} variant="outline" size="sm">
          <RefreshCw size={14} />
          Atualizar
        </Button>
        <div className="flex gap-2">
          {['DELIVERY', 'DINE_IN', 'TAKEAWAY'].map((type) => (
            <button
              key={type}
              onClick={() => fetchOrders({ type })}
              className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1e1e35] border border-[#2d2d4f] transition-colors"
            >
              {type === 'DELIVERY' ? 'Entrega' : type === 'TAKEAWAY' ? 'Retirada' : 'Mesa'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-gray-400">
          {orders.length} pedido(s)
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(({ status, label, color }) => {
            const columnOrders = getOrdersByStatus(status);
            return (
              <div key={status} className="w-80 flex-shrink-0">
                <div className={cn('flex items-center justify-between mb-3 pb-2 border-b-2', color)}>
                  <span className="font-semibold text-white text-sm">{label}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', STATUS_COLORS[status])}>
                    {columnOrders.length}
                  </span>
                </div>
                <div className="space-y-3 kanban-column">
                  {columnOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 card-hover cursor-pointer hover:border-[#FF6B00]/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-bold text-white">#{order.orderNumber}</span>
                        <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">{order.customer?.name || 'Anônimo'}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#2d2d4f] text-gray-400">
                          {order.type === 'DELIVERY' ? 'Entrega' : order.type === 'TAKEAWAY' ? 'Retirada' : 'Mesa'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#2d2d4f] text-gray-400">
                          {order.channel}
                        </span>
                      </div>
                      {/* Items preview */}
                      <div className="mb-3 space-y-1">
                        {order.items?.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-gray-400">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{formatCurrency(Number(item.total))}</span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-xs text-gray-600">+{order.items.length - 3} mais itens</p>
                        )}
                      </div>
                      {order.notes && (
                        <p className="text-xs text-yellow-400 bg-yellow-400/5 rounded px-2 py-1 mb-3">
                          Obs: {order.notes}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{formatCurrency(Number(order.total))}</span>
                        <div className="flex gap-1">
                          {NEXT_STATUS[order.status] && (
                            <Button
                              size="sm"
                              onClick={() => handleAdvanceStatus(order.id, order.status)}
                              loading={updating === order.id}
                              className="text-xs h-7 px-2"
                            >
                              {ORDER_STATUS_LABELS[NEXT_STATUS[order.status]]}
                            </Button>
                          )}
                          {['PENDING', 'CONFIRMED'].includes(order.status) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(order.id)}
                              disabled={updating === order.id}
                              className="text-xs h-7 px-2"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {columnOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-[#2d2d4f] rounded-xl">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
