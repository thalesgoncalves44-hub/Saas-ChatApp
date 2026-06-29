'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#FF6B00', '#00C851', '#FFCC00', '#00B8D9', '#FF3B30'];

export default function FinanceReportsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/financial?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const dre = data?.dre ?? {
    grossRevenue: 0, discounts: 0, deliveryFees: 0, netRevenue: 0, cancelations: 0,
  };
  const paymentMethods = data?.paymentMethods ?? [];
  const dailyRevenue = data?.dailyRevenue ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatório Financeiro</h1>
          <p className="text-gray-400 mt-1">DRE simplificado e análise de pagamentos</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p === 'week' ? '7 dias' : p === 'month' ? '30 dias' : '3 meses'}
            </button>
          ))}
          <button
            onClick={() => api.get('/reports/export/csv?type=financial').then(r => {
              const url = window.URL.createObjectURL(new Blob([r.data]));
              const a = document.createElement('a'); a.href = url; a.download = 'financeiro.csv'; a.click();
            })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:text-white"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {/* DRE Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faturamento Bruto', value: dre.grossRevenue, color: 'text-white' },
          { label: 'Descontos / Cupons', value: -dre.discounts, color: 'text-red-400' },
          { label: 'Taxa de entrega', value: dre.deliveryFees, color: 'text-green-400' },
          { label: 'Faturamento Líquido', value: dre.netRevenue, color: 'text-orange-400' },
        ].map(item => (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{loading ? '—' : fmt(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DRE Table */}
        <Card>
          <CardHeader><CardTitle>DRE Simplificado</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: '(+) Receita bruta de vendas', value: dre.grossRevenue, bold: false },
                { label: '(-) Descontos concedidos', value: -dre.discounts, bold: false },
                { label: '(-) Cancelamentos', value: -dre.cancelations, bold: false },
                { label: '(+) Taxas de entrega cobradas', value: dre.deliveryFees, bold: false },
                { label: '= RECEITA LÍQUIDA', value: dre.netRevenue, bold: true },
              ].map(row => (
                <div key={row.label} className={`flex justify-between py-2 border-b border-gray-800 ${row.bold ? 'font-bold text-orange-400' : 'text-gray-300'}`}>
                  <span className="text-sm">{row.label}</span>
                  <span className="text-sm">{loading ? '—' : fmt(row.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment methods pie */}
        <Card>
          <CardHeader><CardTitle>Formas de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentMethods} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentMethods.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-600">
                {loading ? 'Carregando...' : 'Sem dados para o período'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily revenue bar chart */}
      <Card>
        <CardHeader><CardTitle>Faturamento por dia</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyRevenue}>
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8 }} />
              <Bar dataKey="total" fill="#FF6B00" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
