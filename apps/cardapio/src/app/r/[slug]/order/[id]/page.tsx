'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, ChefHat, Bike, Package, ArrowLeft, Star, X } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const STATUS_STEPS = [
  { key: 'PENDING',    label: 'Pedido recebido',    icon: Check },
  { key: 'CONFIRMED',  label: 'Confirmado',          icon: Check },
  { key: 'PREPARING',  label: 'Preparando',          icon: ChefHat },
  { key: 'READY',      label: 'Pronto',              icon: Package },
  { key: 'DELIVERING', label: 'Saiu para entrega',   icon: Bike },
  { key: 'DELIVERED',  label: 'Entregue',            icon: Check },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Aguardando confirmação',
  CONFIRMED:  'Pedido confirmado',
  PREPARING:  'Sendo preparado na cozinha',
  READY:      'Pronto para entrega/retirada',
  DELIVERING: 'Saiu para entrega',
  DELIVERED:  'Entregue com sucesso! 🎉',
  CANCELLED:  'Pedido cancelado',
};

export default function OrderTrackingPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/public/orders/${id}`);
      if (!res.ok) throw new Error('Pedido não encontrado');
      const data = await res.json();
      setOrder(data);
      // Show review popup if delivered and not yet reviewed
      if (data.status === 'DELIVERED' && !data.review) {
        setTimeout(() => setShowReview(true), 1200);
      }
      if (data.review) setReviewed(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitReview = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/public/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          restaurantId: order.restaurant?.id || order.restaurantId,
          rating,
          comment: comment.trim() || undefined,
          customerName: order.customer?.name,
          customerId: order.customerId,
        }),
      });
      setReviewed(true);
      setShowReview(false);
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = order?.restaurant?.primaryColor || '#FF6B00';
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF6B00', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-gray-500">{error || 'Pedido não encontrado'}</p>
        <Link href={`/r/${slug}`} className="text-orange-500 font-semibold">Voltar ao cardápio</Link>
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
            <h1 className="text-lg font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
            <p className="text-xs text-gray-500">{order.restaurant?.name}</p>
          </div>
          {/* Live pulse */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">ao vivo</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className="rounded-2xl p-5 text-white text-center" style={{ backgroundColor: primaryColor }}>
          <p className="text-lg font-bold">{STATUS_LABELS[order.status] || order.status}</p>
          <p className="text-sm opacity-80 mt-1 flex items-center justify-center gap-1">
            <Clock size={13} /> Atualizado automaticamente a cada 15s
          </p>
        </div>

        {/* Progress Steps */}
        {order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx <= currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex items-center gap-3 mb-4 last:mb-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={isDone ? { backgroundColor: primaryColor, color: 'white' } : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}
                  >
                    <Icon size={14} />
                  </div>
                  <p className={`text-sm font-medium flex-1 ${isActive ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {isActive && <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Review CTA (after delivery, if already reviewed or dismissed) */}
        {order.status === 'DELIVERED' && reviewed && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-green-700 font-semibold text-sm">✅ Avaliação enviada! Obrigado 🙏</p>
          </div>
        )}
        {order.status === 'DELIVERED' && !reviewed && !showReview && (
          <button
            onClick={() => setShowReview(true)}
            className="w-full py-3 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Star size={16} fill="currentColor" /> Avaliar meu pedido
          </button>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Itens do pedido</h3>
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start text-sm">
                <div className="flex gap-2">
                  <span className="font-bold text-gray-700">{item.quantity}x</span>
                  <div>
                    <p className="text-gray-900 font-medium">{item.product?.name || item.name}</p>
                    {item.notes && <p className="text-gray-400 text-xs">Obs: {item.notes}</p>}
                  </div>
                </div>
                <span className="text-gray-700 font-medium">{fmt(Number(item.unitPrice || item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{fmt(Number(order.total))}</span>
          </div>
        </div>

        {order.deliveryAddress && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">Endereço de entrega</h3>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </div>
        )}

        <Link
          href={`/r/${slug}`}
          className="block w-full py-3 text-center rounded-2xl border-2 font-semibold text-sm"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Fazer novo pedido
        </Link>
      </div>

      {/* ── Review Popup ── */}
      {showReview && !reviewed && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowReview(false)}>
          <div
            className="bg-white w-full max-w-2xl rounded-t-3xl p-6 pb-10 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Como foi seu pedido?</h2>
                <p className="text-sm text-gray-500 mt-0.5">Sua avaliação ajuda o restaurante a melhorar 🙏</p>
              </div>
              <button onClick={() => setShowReview(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    size={44}
                    className="transition-colors"
                    style={{ color: star <= (hovered || rating) ? '#f59e0b' : '#e5e7eb' }}
                    fill={star <= (hovered || rating) ? '#f59e0b' : '#e5e7eb'}
                  />
                </button>
              ))}
            </div>

            {/* Label for rating */}
            {rating > 0 && (
              <p className="text-center text-sm font-semibold text-gray-700">
                {['', 'Muito ruim 😞', 'Ruim 😕', 'Regular 😐', 'Bom 😊', 'Excelente! 🤩'][rating]}
              </p>
            )}

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte o que achou (opcional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-orange-400 transition-colors"
            />

            <button
              onClick={handleSubmitReview}
              disabled={!rating || submitting}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? 'Enviando...' : 'Enviar avaliação'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
