'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Card, StatsCard } from '../../../components/ui/card';
import { formatCurrency } from '../../../lib/utils';
import api from '../../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [dashRes, finRes, custRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/financial', { params: dateRange }),
        api.get('/reports/customers'),
      ]);
      setDashboard(dashRes.data);
      setFinancial(finRes.data);
      setCustomers(custRes.data);
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
      <Header title="Relatórios" subtitle="Análise completa do seu negócio" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Date Range */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">De:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((d) => ({ ...d, startDate: e.target.value }))}
              className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#FF6B00] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Até:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((d) => ({ ...d, endDate: e.target.value }))}
              className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[#FF6B00] outline-none"
            />
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total de Pedidos" value={financial?.totalOrders || 0} icon={null} color="orange" />
          <StatsCard title="Receita Bruta" value={formatCurrency(Number(financial?.totalRevenue || 0))} icon={null} color="green" />
          <StatsCard title="Total de Descontos" value={formatCurrency(Number(financial?.totalDiscount || 0))} icon={null} color="blue" />
          <StatsCard title="Taxa de Entrega" value={formatCurrency(Number(financial?.totalDeliveryFee || 0))} icon={null} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Faturamento por Dia</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dashboard?.revenueByDay || []}>
                <XAxis dataKey="date" stroke="#606080" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#606080" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e35', border: '1px solid #2d2d4f', borderRadius: 8 }}
                  formatter={(v: number) => [formatCurrency(v), 'Faturamento']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Payment Methods */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Formas de Pagamento</h3>
            {financial?.paymentsByMethod?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={financial.paymentsByMethod}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="total"
                    nameKey="method"
                  >
                    {financial.paymentsByMethod.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-gray-500 text-sm">Sem dados de pagamento</div>
            )}
          </Card>

          {/* Top Products */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Produtos Mais Vendidos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(dashboard?.topProducts || []).slice(0, 8)} layout="vertical">
                <XAxis type="number" stroke="#606080" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#606080" tick={{ fontSize: 10 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e35', border: '1px solid #2d2d4f', borderRadius: 8 }}
                  formatter={(v: number) => [v, 'Vendidos']}
                />
                <Bar dataKey="quantity" fill="#FF6B00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Customer Segments */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Segmentos de Clientes</h3>
            <div className="space-y-3">
              {(customers?.segments || []).map((seg: any, i: number) => (
                <div key={seg.segment} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-gray-300 flex-1 capitalize">{seg.segment}</span>
                  <span className="text-sm font-semibold text-white">{seg._count}</span>
                  <span className="text-sm text-[#FF6B00]">{formatCurrency(Number(seg._sum?.totalSpent || 0))}</span>
                </div>
              ))}
              {!customers?.segments?.length && (
                <p className="text-gray-500 text-sm text-center py-4">Sem dados de clientes</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
