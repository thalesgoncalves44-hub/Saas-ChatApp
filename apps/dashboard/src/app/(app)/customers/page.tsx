'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { formatCurrency, formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import {
  Search, Users, Star, TrendingDown, Clock, UserX,
  Download, Phone, Mail, Gift, MessageCircle, Filter,
  TrendingUp, DollarSign, ShoppingBag, UserCheck,
} from 'lucide-react';

const SEGMENTS = [
  { key: 'all', label: 'Todos', icon: Users, color: 'text-gray-400' },
  { key: 'loyal', label: 'Fiéis', icon: Star, color: 'text-yellow-400' },
  { key: 'regular', label: 'Regulares', icon: TrendingUp, color: 'text-green-400' },
  { key: 'occasional', label: 'Ocasionais', icon: ShoppingBag, color: 'text-blue-400' },
  { key: 'at_risk', label: 'Em risco', icon: Clock, color: 'text-orange-400' },
  { key: 'lost', label: 'Perdidos', icon: UserX, color: 'text-red-400' },
  { key: 'new', label: 'Novos', icon: UserCheck, color: 'text-purple-400' },
];

const SEGMENT_COLORS: Record<string, string> = {
  loyal: 'success',
  regular: 'info',
  occasional: 'info',
  at_risk: 'warning',
  lost: 'error',
  new: 'default',
};

const SEGMENT_LABELS: Record<string, string> = {
  loyal: 'Fiel',
  regular: 'Regular',
  occasional: 'Ocasional',
  at_risk: 'Em risco',
  lost: 'Perdido',
  new: 'Novo',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [segmentStats, setSegmentStats] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadCustomers(); }, [search, segment]);
  useEffect(() => {
    api.get('/customers/segments').then(({ data }) => setSegmentStats(data)).catch(() => {});
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (segment !== 'all') params.segment = segment;
      const { data } = await api.get('/customers', { params });
      setCustomers(data.customers);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/customers/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const getSegmentCount = (key: string) =>
    segmentStats.find((s: any) => s.segment === key)?._count || 0;

  // Summary stats
  const totalRevenue = customers.reduce((s, c) => s + Number(c.totalSpent), 0);
  const withEmail = customers.filter((c) => c.email).length;
  const withPhone = customers.filter((c) => c.phone).length;

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Clientes"
        subtitle={`${total} clientes cadastrados`}
        action={
          <Button onClick={handleExport} loading={exporting} size="sm" variant="outline" className="gap-1.5">
            <Download size={14} />
            Exportar CSV
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total', value: total, color: 'text-[#FF6B00]', bg: 'bg-[#FF6B00]/10' },
            { icon: DollarSign, label: 'Receita total', value: formatCurrency(totalRevenue), color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: Mail, label: 'Com e-mail', value: `${withEmail} (${total ? Math.round(withEmail / total * 100) : 0}%)`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Phone, label: 'Com WhatsApp', value: `${withPhone}`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className={`font-bold text-sm ${color}`}>{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Segment filter */}
        <div className="flex gap-2 flex-wrap">
          {SEGMENTS.map(({ key, label, icon: Icon, color }) => {
            const count = key === 'all' ? total : getSegmentCount(key);
            return (
              <button
                key={key}
                onClick={() => setSegment(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  segment === key
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#1a1a2e] border border-[#2d2d4f] text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={13} className={segment === key ? 'text-white' : color} />
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${segment === key ? 'bg-white/20' : 'bg-[#2d2d4f]'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + actions row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Com e-mail</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF6B00]" /> Com WhatsApp</span>
          </div>
        </div>

        {/* Export hint */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
          <Download size={16} className="text-blue-400 shrink-0" />
          <div className="flex-1">
            <p className="text-blue-300 text-sm font-semibold">Público para tráfego pago</p>
            <p className="text-blue-400/70 text-xs">Exporte o CSV e importe como público personalizado no Meta Ads ou Google Ads para atingir seus clientes com anúncios.</p>
          </div>
          <Button onClick={handleExport} loading={exporting} size="sm" className="shrink-0 bg-blue-500 hover:bg-blue-600 gap-1">
            <Download size={12} /> Exportar
          </Button>
        </div>

        {/* Table */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d4f]">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Contato</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Pedidos</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Total gasto</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Pontos</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Segmento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Último pedido</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d4f]">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#1e1e35] transition-colors group">
                  <td className="py-3 px-4">
                    <Link href={`/customers/${customer.id}`}>
                      <div>
                        <p className="font-medium text-white text-sm group-hover:text-[#FF6B00] transition-colors">{customer.name}</p>
                        {customer.birthDate && (
                          <p className="text-xs text-purple-400 flex items-center gap-1 mt-0.5">
                            <Gift size={10} />
                            {new Date(customer.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {customer.phone && (
                        <a
                          href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-[#FF6B00] hover:underline"
                        >
                          <MessageCircle size={10} /> {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={10} /> {customer.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-white font-medium">{customer.totalOrders}</td>
                  <td className="py-3 px-4 text-sm text-green-400 font-semibold">{formatCurrency(Number(customer.totalSpent))}</td>
                  <td className="py-3 px-4 text-sm text-[#FF6B00] font-semibold">{customer.loyaltyPoints} pts</td>
                  <td className="py-3 px-4">
                    <Badge variant={(SEGMENT_COLORS[customer.segment] || 'default') as any}>
                      {SEGMENT_LABELS[customer.segment] || customer.segment}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Nunca'}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/customers/${customer.id}`} className="text-xs text-gray-500 hover:text-[#FF6B00] transition-colors">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-500">
                    <Users size={40} className="mx-auto mb-3 text-gray-700" />
                    <p className="font-medium">Nenhum cliente encontrado</p>
                    <p className="text-xs text-gray-600 mt-1">Os clientes aparecem automaticamente quando fazem pedidos no cardápio</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
