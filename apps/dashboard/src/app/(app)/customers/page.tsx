'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { formatCurrency, formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { Search, Users, Star, TrendingDown, Clock, UserX } from 'lucide-react';

const SEGMENTS = [
  { key: 'all', label: 'Todos', icon: Users },
  { key: 'loyal', label: 'Fiéis', icon: Star },
  { key: 'regular', label: 'Regulares', icon: TrendingDown },
  { key: 'at_risk', label: 'Em risco', icon: Clock },
  { key: 'lost', label: 'Perdidos', icon: UserX },
];

const SEGMENT_COLORS: Record<string, string> = {
  loyal: 'success',
  regular: 'info',
  occasional: 'warning',
  at_risk: 'warning',
  lost: 'error',
  new: 'default',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [segmentStats, setSegmentStats] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, [search, segment]);

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

  return (
    <div className="flex flex-col h-screen">
      <Header title="Clientes" subtitle={`${total} clientes cadastrados`} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Segment filter */}
        <div className="flex gap-2 flex-wrap">
          {SEGMENTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSegment(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                segment === key
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-[#1a1a2e] border border-[#2d2d4f] text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="max-w-sm">
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>

        {/* Table */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d4f]">
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Cliente</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Telefone</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Pedidos</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Total Gasto</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Ticket Médio</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Pontos</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Segmento</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-gray-400 uppercase">Último Pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d4f]">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#1e1e35] transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/customers/${customer.id}`} className="hover:text-[#FF6B00]">
                      <div>
                        <p className="font-medium text-white text-sm">{customer.name}</p>
                        {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{customer.phone || '-'}</td>
                  <td className="py-3 px-4 text-sm text-white font-medium">{customer.totalOrders}</td>
                  <td className="py-3 px-4 text-sm text-white font-semibold">{formatCurrency(Number(customer.totalSpent))}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{formatCurrency(Number(customer.averageTicket))}</td>
                  <td className="py-3 px-4 text-sm text-[#FF6B00] font-semibold">{customer.loyaltyPoints}</td>
                  <td className="py-3 px-4">
                    <Badge variant={(SEGMENT_COLORS[customer.segment] || 'default') as any}>
                      {customer.segment}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Nunca'}
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <p className="text-3xl mb-3">👥</p>
                    <p>Nenhum cliente encontrado</p>
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
