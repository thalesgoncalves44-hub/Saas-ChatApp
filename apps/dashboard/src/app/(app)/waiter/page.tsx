'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { formatCurrency } from '../../../lib/utils';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import { Smartphone, ShoppingCart, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function WaiterPage() {
  const { restaurant } = useAuthStore();
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tables').then(({ data }) => setTables(data)),
      api.get('/orders', { params: { status: 'READY' } }).then(({ data }) => setOrders(data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-[#0f0f1a] p-4">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-2 py-4">
          <Smartphone size={24} className="text-[#FF6B00]" />
          <h1 className="text-xl font-bold text-white">Interface do Garçom</h1>
        </div>

        {orders.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="font-semibold text-green-400 mb-2">Pedidos Prontos para Entrega</h3>
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-green-500/20 last:border-0">
                <div>
                  <span className="font-bold text-white">#{order.orderNumber}</span>
                  {order.table && <span className="text-sm text-gray-400 ml-2">{order.table.name}</span>}
                </div>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs"
                  onClick={() => api.patch(`/orders/${order.id}/status`, { status: 'DELIVERED' })}>
                  Entregar
                </Button>
              </div>
            ))}
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Mesas</h3>
          <div className="grid grid-cols-2 gap-3">
            {tables.filter((t) => t.isActive).map((table) => (
              <div key={table.id} className={`rounded-xl p-4 border text-center ${table.status === 'OCCUPIED' ? 'bg-red-500/10 border-red-500/30' : 'bg-[#1a1a2e] border-[#2d2d4f]'}`}>
                <p className="font-bold text-white text-lg">{table.name}</p>
                <p className="text-xs text-gray-500">{table.capacity} pessoas</p>
                <p className={`text-xs mt-1 font-medium ${table.status === 'OCCUPIED' ? 'text-red-400' : 'text-green-400'}`}>
                  {table.status === 'OCCUPIED' ? 'Ocupada' : 'Livre'}
                </p>
                {table.orders?.[0] && (
                  <p className="text-xs text-gray-600 mt-1">Pedido #{table.orders[0].orderNumber}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <Link href="/orders">
          <Button variant="outline" className="w-full">
            <ShoppingCart size={16} />
            Ver Todos os Pedidos
            <ChevronRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
