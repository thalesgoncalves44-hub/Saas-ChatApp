'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Card, StatsCard } from '../../../components/ui/card';
import api from '../../../lib/api';
import { DollarSign, CreditCard, QrCode, Banknote } from 'lucide-react';

export default function FinancePage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(({ data }) => setDashboard(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex flex-col h-screen">
      <Header title="Financeiro" subtitle="Caixa e relatórios financeiros" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Faturamento Hoje" value={formatCurrency(Number(dashboard?.today?.revenue || 0))} icon={<DollarSign size={22} />} color="green" />
          <StatsCard title="Pedidos Hoje" value={dashboard?.today?.orders || 0} icon={<DollarSign size={22} />} color="orange" />
          <StatsCard title="Faturamento Mensal" value={formatCurrency(Number(dashboard?.month?.revenue || 0))} icon={<DollarSign size={22} />} color="blue" />
          <StatsCard title="Clientes" value={dashboard?.totalCustomers || 0} icon={<DollarSign size={22} />} color="purple" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-white mb-4">Formas de Pagamento</h3>
            <div className="space-y-3">
              {[
                { label: 'Dinheiro', icon: <Banknote size={18} />, key: 'CASH' },
                { label: 'Cartão de Crédito', icon: <CreditCard size={18} />, key: 'CREDIT_CARD' },
                { label: 'Cartão de Débito', icon: <CreditCard size={18} />, key: 'DEBIT_CARD' },
                { label: 'Pix', icon: <QrCode size={18} />, key: 'PIX' },
              ].map(({ label, icon, key }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-[#FF6B00]">{icon}</div>
                  <span className="flex-1 text-sm text-gray-300">{label}</span>
                  <span className="text-sm font-semibold text-white">{formatCurrency(0)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-4">Resumo do Dia</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Total de Pedidos</span><span className="text-white font-medium">{dashboard?.today?.orders || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Receita Bruta</span><span className="text-white font-medium">{formatCurrency(Number(dashboard?.today?.revenue || 0))}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pedidos Pendentes</span><span className="text-yellow-400 font-medium">{dashboard?.today?.pendingOrders || 0}</span></div>
              <div className="border-t border-[#2d2d4f] pt-3 flex justify-between">
                <span className="text-gray-300 font-semibold">Total Líquido</span>
                <span className="text-[#FF6B00] font-bold text-lg">{formatCurrency(Number(dashboard?.today?.revenue || 0))}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
