'use client';
import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../../lib/cart.store';
import { ArrowLeft, MapPin, Store, Utensils, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

type OrderType = 'DELIVERY' | 'TAKEOUT' | 'DINE_IN';
type PaymentMethod = 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD';

interface RestaurantInfo {
  id: string;
  name: string;
  deliveryFee: number;
  primaryColor: string;
  isOpen: boolean;
  minimumOrder?: number;
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, getTotal, restaurantId, clearCart } = useCartStore();

  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/public/r/${slug}`)
      .then((r) => r.json())
      .then((d) => setRestaurant(d))
      .catch(() => {});
  }, [slug, API_URL]);

  useEffect(() => {
    if (items.length === 0 && !orderId) {
      router.push(`/r/${slug}`);
    }
  }, [items, orderId, router, slug]);

  const deliveryFee = orderType === 'DELIVERY' ? Number(restaurant?.deliveryFee || 0) : 0;
  const subtotal = getTotal();
  const discount = couponDiscount;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const primaryColor = restaurant?.primaryColor || '#FF6B00';

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch(
        `${API_URL}/coupons/validate?code=${encodeURIComponent(couponCode)}&restaurantId=${restaurantId}&orderTotal=${subtotal}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cupom inválido');
      const disc =
        data.discountType === 'PERCENTAGE'
          ? (subtotal * data.discountValue) / 100
          : data.discountValue;
      setCouponDiscount(Math.min(disc, subtotal));
    } catch (e: any) {
      setCouponError(e.message);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Preencha seu nome e telefone');
      return;
    }
    if (orderType === 'DELIVERY' && !address.trim()) {
      setError('Preencha o endereço de entrega');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          type: orderType,
          channel: 'APP',
          paymentMethod,
          customerName: name,
          customerPhone: phone,
          deliveryAddress: orderType === 'DELIVERY' ? address : undefined,
          couponCode: couponCode || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes,
            unitPrice: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao fazer pedido');

      const newOrderId = data.id;
      setOrderId(newOrderId);

      if (paymentMethod === 'PIX') {
        const pixRes = await fetch(`${API_URL}/payments/pix/${newOrderId}`, { method: 'POST' });
        if (pixRes.ok) {
          const pixD = await pixRes.json();
          setPixData({ qrCode: pixD.qrCode, copyPaste: pixD.copyPaste });
        }
      }

      clearCart();
      if (paymentMethod !== 'PIX') {
        router.push(`/r/${slug}/order/${newOrderId}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (pixData && orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Pedido realizado!</h2>
          <p className="text-gray-500 text-sm">Pague com PIX para confirmar seu pedido</p>

          {pixData.qrCode && (
            <img src={pixData.qrCode} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-xl border" />
          )}

          {pixData.copyPaste && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Ou copie o código PIX:</p>
              <div className="bg-gray-100 rounded-xl p-3">
                <p className="text-xs font-mono text-gray-700 break-all">{pixData.copyPaste}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(pixData.copyPaste)}
                className="text-sm font-semibold"
                style={{ color: primaryColor }}
              >
                Copiar código
              </button>
            </div>
          )}

          <div className="pt-2 border-t">
            <span className="text-2xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(total)}
            </span>
          </div>

          <Link
            href={`/r/${slug}/order/${orderId}`}
            className="block w-full py-3 rounded-2xl text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            Acompanhar pedido
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/r/${slug}/cart`} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Finalizar pedido</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-32">
        {/* Order Type */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">Tipo de pedido</h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'DELIVERY', label: 'Entrega', icon: MapPin },
              { value: 'TAKEOUT', label: 'Retirada', icon: Store },
              { value: 'DINE_IN', label: 'Mesa', icon: Utensils },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setOrderType(value)}
                className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all"
                style={
                  orderType === value
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10`, color: primaryColor }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >
                <Icon size={20} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Seus dados</h3>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome *"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp (11) 99999-9999 *"
            type="tel"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400"
          />
          {orderType === 'DELIVERY' && (
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Endereço completo de entrega *"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 resize-none"
            />
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">Pagamento</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'PIX', label: 'PIX' },
              { value: 'CREDIT_CARD', label: 'Cartão Crédito' },
              { value: 'DEBIT_CARD', label: 'Cartão Débito' },
              { value: 'CASH', label: 'Dinheiro' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className="py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                style={
                  paymentMethod === value
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10`, color: primaryColor }
                    : { borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Coupon */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3">Cupom de desconto</h3>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o cupom"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 uppercase"
            />
            <button
              onClick={validateCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {couponLoading ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
          {couponDiscount > 0 && (
            <p className="text-green-600 text-xs mt-2 font-semibold">
              Desconto de {formatCurrency(couponDiscount)} aplicado!
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <h3 className="font-bold text-gray-900 mb-1">Resumo</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Desconto</span>
              <span>-{formatCurrency(couponDiscount)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-lg" style={{ color: primaryColor }}>{formatCurrency(total)}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Enviando pedido...
            </>
          ) : (
            `Fazer pedido • ${formatCurrency(total)}`
          )}
        </button>
      </div>
    </div>
  );
}
