'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Button } from '../../../../components/ui/button';
import { ArrowLeft, Phone, Mail, MapPin, ShoppingBag, Star, Calendar } from 'lucide-react';
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../../lib/utils';

const SEGMENT_LABELS: Record<string, string> = {
  new: 'Novo',
  loyal: 'Fiel',
  regular: 'Regular',
  occasional: 'Ocasional',
  at_risk: 'Em risco',
  lost: 'Perdido',
};

const SEGMENT_COLORS: Record<string, string> = {
  new: 'bg-blue-900/50 text-blue-400',
  loyal: 'bg-green-900/50 text-green-400',
  regular: 'bg-emerald-900/50 text-emerald-400',
  occasional: 'bg-yellow-900/50 text-yellow-400',
  at_risk: 'bg-orange-900/50 text-orange-400',
  lost: 'bg-red-900/50 text-red-400',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/customers/${id}`), api.get(`/customers/${id}/orders`)])
      .then(([custRes, ordersRes]) => {
        setCustomer(custRes.data);
        setOrders(ordersRes.data || []);
      })
      .catch(() => setError('Cliente não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <p className="text-red-400">{error}</p>
        <button onClick={() => router.back()} className="text-[#FF6B00] text-sm mt-2">Voltar</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[#1e1e35] text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEGMENT_COLORS[customer.segment] || 'bg-gray-700 text-gray-300'}`}>
            {SEGMENT_LABELS[customer.segment] || customer.segment}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact */}
        <div className="bg-[#1a1a2e] rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Contato</h3>
          <div className="space-y-2">
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-[#FF6B00] text-sm">
                <Phone size={14} /> {customer.phone}
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-gray-300 text-sm">
                <Mail size={14} /> {customer.email}
              </a>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" /> {customer.address}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1a2e] rounded-xl p-4 text-center">
            <ShoppingBag size={20} className="text-[#FF6B00] mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{customer.totalOrders || 0}</p>
            <p className="text-gray-400 text-xs mt-0.5">Pedidos</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 text-center">
            <Star size={20} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{formatCurrency(Number(customer.totalSpent || 0))}</p>
            <p className="text-gray-400 text-xs mt-0.5">Total gasto</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 text-center">
            <Calendar size={20} className="text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">
              {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR') : '-'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">Último pedido</p>
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-4 text-center">
            <div className="text-[#FF6B00] text-lg font-bold mx-auto w-fit mb-1">
              {customer.loyaltyPoints || 0}
            </div>
            <p className="text-2xl font-bold text-white">{customer.loyaltyPoints || 0}</p>
            <p className="text-gray-400 text-xs mt-0.5">Pontos fidelidade</p>
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="bg-[#1a1a2e] rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2">Notas</h3>
            <p className="text-gray-300 text-sm">{customer.notes}</p>
          </div>
        )}

        {/* Order History */}
        <div className="bg-[#1a1a2e] rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Histórico de pedidos</h3>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pedido encontrado</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-[#2d2d4f] last:border-0 cursor-pointer hover:opacity-80"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-700 text-gray-300'}`}>
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                    </span>
                    <p className="text-[#FF6B00] text-sm font-bold mt-0.5">{formatCurrency(Number(order.total))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp */}
        {customer.phone && (
          <a
            href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full" size="lg">
              Enviar WhatsApp
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
