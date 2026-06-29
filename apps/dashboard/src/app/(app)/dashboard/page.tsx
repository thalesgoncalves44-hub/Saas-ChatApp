'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { StatsCard } from '../../../components/ui/card';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../lib/utils';
import { Badge } from '../../../components/ui/badge';
import api from '../../../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from 'recharts';
import { cn } from '../../../lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get('/reports/dashboard');
      setData(data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="Dashboard" subtitle="Visão geral do seu restaurante" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pedidos Hoje"
            value={data?.today?.orders || 0}
            subtitle={`${data?.today?.pendingOrders || 0} pendentes`}
            icon={<ShoppingBag size={22} />}
            color="orange"
          />
          <StatsCard
            title="Faturamento Hoje"
            value={formatCurrency(data?.today?.revenue || 0)}
            subtitle="Pedidos aprovados"
            icon={<DollarSign size={22} />}
            color="green"
          />
          <StatsCard
            title="Faturamento Mensal"
            value={formatCurrency(data?.month?.revenue || 0)}
            subtitle="Últimos 30 dias"
            icon={<TrendingUp size={22} />}
            color="blue"
          />
          <StatsCard
            title="Total de Clientes"
            value={data?.totalCustomers || 0}
            subtitle="Cadastrados"
            icon={<Users size={22} />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Faturamento - últimos 30 dias</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.revenueByDay || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#606080" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#606080" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e35', border: '1px solid #2d2d4f', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#FF6B00" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Produtos</h3>
            <div className="space-y-3">
              {(data?.topProducts || []).slice(0, 5).map((product: any, i: number) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-600 w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} vendidos</p>
                  </div>
                  <span className="text-sm text-[#FF6B00] font-semibold">
                    {formatCurrency(Number(product.revenue))}
                  </span>
                </div>
              ))}
              {!data?.topProducts?.length && (
                <p className="text-gray-500 text-sm text-center py-4">Nenhum produto vendido ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pedidos Recentes</h3>
            <a href="/orders" className="text-sm text-[#FF6B00] hover:underline">Ver todos</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d4f]">
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">#</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Cliente</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Tipo</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Total</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d4f]">
                {(data?.recentOrders || []).map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#1e1e35] transition-colors">
                    <td className="py-3 px-2 text-sm font-medium text-white">#{order.orderNumber}</td>
                    <td className="py-3 px-2 text-sm text-gray-300">{order.customer?.name || 'Anônimo'}</td>
                    <td className="py-3 px-2 text-sm text-gray-300">
                      {order.type === 'DELIVERY' ? 'Entrega' : order.type === 'TAKEAWAY' ? 'Retirada' : 'Mesa'}
                    </td>
                    <td className="py-3 px-2 text-sm font-semibold text-white">{formatCurrency(Number(order.total))}</td>
                    <td className="py-3 px-2">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', ORDER_STATUS_COLORS[order.status])}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
                {!data?.recentOrders?.length && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
