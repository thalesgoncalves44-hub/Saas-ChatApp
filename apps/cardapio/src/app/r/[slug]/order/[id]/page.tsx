'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, ChefHat, Bike, Package, ArrowLeft } from 'lucide-react';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Pedido recebido', icon: Check },
  { key: 'CONFIRMED', label: 'Confirmado', icon: Check },
  { key: 'PREPARING', label: 'Preparando', icon: ChefHat },
  { key: 'READY', label: 'Pronto', icon: Package },
  { key: 'DELIVERING', label: 'Saiu para entrega', icon: Bike },
  { key: 'DELIVERED', label: 'Entregue', icon: Check },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Pedido confirmado',
  PREPARING: 'Sendo preparado na cozinha',
  READY: 'Pronto para entrega/retirada',
  DELIVERING: 'Saiu para entrega',
  DELIVERED: 'Entregue com sucesso!',
  CANCELLED: 'Pedido cancelado',
};

export default function OrderTrackingPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/public/orders/${id}`);
      if (!res.ok) throw new Error('Pedido não encontrado');
      const data = await res.json();
      setOrder(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 15 seconds for status updates
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const primaryColor = order?.restaurant?.primaryColor || '#FF6B00';
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-gray-500">{error || 'Pedido não encontrado'}</p>
        <Link href={`/r/${slug}`} className="text-orange-500 font-semibold">
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/r/${slug}`} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pedido #{order.orderNumber || id.slice(-6).toUpperCase()}</h1>
            <p className="text-xs text-gray-500">{order.restaurant?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className="rounded-2xl p-5 text-white text-center" style={{ backgroundColor: primaryColor }}>
          <p className="text-lg font-bold">{STATUS_LABELS[order.status] || order.status}</p>
          <p className="text-sm opacity-80 mt-1 flex items-center justify-center gap-1">
            <Clock size={13} />
            Atualizado agora
          </p>
        </div>

        {/* Progress Steps */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="relative">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIdx;
                const isActive = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center gap-3 mb-4 last:mb-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={
                        isDone
                          ? { backgroundColor: primaryColor, color: 'white' }
                          : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                      }
                    >
                      <Icon size={14} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">Itens do pedido</h3>
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex gap-2">
                  <span className="font-bold text-gray-700">{item.quantity}x</span>
                  <div>
                    <p className="text-gray-900 font-medium">{item.product?.name || item.productId}</p>
                    {item.notes && <p className="text-gray-400 text-xs">Obs: {item.notes}</p>}
                  </div>
                </div>
                <span className="text-gray-700 font-medium">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{formatCurrency(Number(order.total))}</span>
          </div>
        </div>

        {/* Delivery Info */}
        {order.deliveryAddress && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-1">Endereço de entrega</h3>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </div>
        )}

        {/* Back to menu */}
        <Link
          href={`/r/${slug}`}
          className="block w-full py-3 text-center rounded-2xl border-2 font-semibold text-sm"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Fazer novo pedido
        </Link>
      </div>
    </div>
  );
}
