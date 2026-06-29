'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Button } from '../../../../components/ui/button';
import { ArrowLeft, Phone, MapPin, MessageSquare, Clock } from 'lucide-react';
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../../lib/utils';

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DELIVERING',
  DELIVERING: 'DELIVERED',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch {
      setError('Pedido não encontrado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const advanceStatus = async () => {
    if (!order || !NEXT_STATUS[order.status]) return;
    setStatusLoading(true);
    try {
      const res = await api.patch(`/orders/${id}/status`, { status: NEXT_STATUS[order.status] });
      setOrder(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setStatusLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm('Cancelar este pedido?')) return;
    setStatusLoading(true);
    try {
      const res = await api.patch(`/orders/${id}/status`, { status: 'CANCELLED' });
      setOrder(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao cancelar');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <p className="text-red-400">{error || 'Pedido não encontrado'}</p>
        <button onClick={() => router.back()} className="text-[#FF6B00] text-sm mt-2">
          Voltar
        </button>
      </div>
    );
  }

  const canAdvance = NEXT_STATUS[order.status];
  const canCancel = !['DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[#1e1e35] text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            Pedido #{order.orderNumber || id.slice(-6).toUpperCase()}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-700 text-gray-300'}`}>
              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
            </span>
            <span className="text-gray-500 text-xs flex items-center gap-1">
              <Clock size={11} />
              {new Date(order.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        {order.customer && (
          <div className="bg-[#1a1a2e] rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Cliente</h3>
            <p className="text-white font-medium">{order.customer.name}</p>
            {order.customer.phone && (
              <a href={`tel:${order.customer.phone}`} className="text-[#FF6B00] text-sm flex items-center gap-1 mt-1">
                <Phone size={13} /> {order.customer.phone}
              </a>
            )}
            {order.customer.email && (
              <p className="text-gray-400 text-sm mt-1">{order.customer.email}</p>
            )}
          </div>
        )}

        {/* Delivery info */}
        {order.deliveryAddress && (
          <div className="bg-[#1a1a2e] rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-[#FF6B00]" />
              Endereço de entrega
            </h3>
            <p className="text-gray-300 text-sm">{order.deliveryAddress}</p>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-[#1a1a2e] rounded-xl p-5">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#FF6B00]" />
              Observações
            </h3>
            <p className="text-gray-300 text-sm">{order.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-[#1a1a2e] rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Itens do pedido</h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <span className="text-[#FF6B00] font-bold">{item.quantity}x</span>
                  <div>
                    <p className="text-white text-sm font-medium">{item.product?.name || 'Produto'}</p>
                    {item.notes && <p className="text-gray-500 text-xs">Obs: {item.notes}</p>}
                  </div>
                </div>
                <span className="text-gray-300 text-sm">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#2d2d4f] mt-4 pt-4 space-y-2">
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
            )}
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Desconto</span>
                <span>-{formatCurrency(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white">
              <span>Total</span>
              <span className="text-[#FF6B00] text-lg">{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-[#1a1a2e] rounded-xl p-5">
          <h3 className="font-semibold text-white mb-2">Pagamento</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Método</span>
            <span className="text-gray-200">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Status</span>
            <span className={order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}>
              {order.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {canCancel && order.status !== 'DELIVERED' && (
            <Button variant="destructive" size="lg" loading={statusLoading} onClick={cancelOrder} className="flex-1">
              Cancelar
            </Button>
          )}
          {canAdvance && (
            <Button size="lg" loading={statusLoading} onClick={advanceStatus} className="flex-1">
              {ORDER_STATUS_LABELS[NEXT_STATUS[order.status] as keyof typeof ORDER_STATUS_LABELS] || 'Avançar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
