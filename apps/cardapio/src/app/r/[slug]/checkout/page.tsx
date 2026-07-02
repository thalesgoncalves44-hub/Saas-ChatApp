'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '../../../../lib/cart.store';
import {
  ArrowLeft, MapPin, Store, Utensils, Check, Loader2,
  ChevronRight, User, Phone, Mail, Gift, Tag, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const STORAGE_KEY = 'zappai_customer';

type OrderType = 'DELIVERY' | 'TAKEOUT' | 'DINE_IN';
type PaymentMethod = 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD';

interface SavedCustomer {
  name: string; phone: string; email: string;
  address: string; birthDate: string; customerId?: string;
}

function phoneMask(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, getTotal, restaurantId, clearCart } = useCartStore();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');

  // Customer fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');

  // UX state
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<SavedCustomer | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');

  // Order state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const lookupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const primaryColor = restaurant?.primaryColor || '#FF6B00';

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/public/r/${slug}`).then(r => r.json()).then(setRestaurant).catch(() => {});
  }, [slug, API_URL]);

  // Load saved customer from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedCustomer = JSON.parse(raw);
        setSavedCustomer(saved);
        setName(saved.name);
        setPhone(saved.phone);
        setEmail(saved.email);
        setAddress(saved.address || '');
        setBirthDate(saved.birthDate || '');
        setShowWelcomeBack(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (items.length === 0 && !orderId) router.push(`/r/${slug}`);
  }, [items, orderId, router, slug]);

  // Debounced phone lookup
  const handlePhoneChange = useCallback((raw: string) => {
    const masked = phoneMask(raw);
    setPhone(masked);
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 10 && restaurantId) {
      lookupTimerRef.current = setTimeout(async () => {
        setLookingUp(true);
        try {
          const res = await fetch(
            `${API_URL}/public/customer/lookup?phone=${encodeURIComponent(masked)}&restaurantId=${restaurantId}`,
          );
          if (res.ok) {
            const found = await res.json();
            if (found?.name) {
              setFoundCustomer(found);
              // auto-fill empty fields
              if (!name) setName(found.name);
              if (!email) setEmail(found.email || '');
              if (!address) setAddress(found.address || '');
              if (!birthDate) setBirthDate(found.birthDate ? found.birthDate.slice(0, 10) : '');
            }
          }
        } catch {}
        setLookingUp(false);
      }, 700);
    }
  }, [restaurantId, name, email, address, birthDate, API_URL]);

  const applyFoundCustomer = () => {
    if (!foundCustomer) return;
    setName(foundCustomer.name);
    setEmail(foundCustomer.email || '');
    setAddress(foundCustomer.address || '');
    setBirthDate(foundCustomer.birthDate ? foundCustomer.birthDate.slice(0, 10) : '');
    setFoundCustomer(null);
  };

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedCustomer(null);
    setShowWelcomeBack(false);
    setName(''); setPhone(''); setEmail(''); setAddress(''); setBirthDate('');
  };

  const deliveryFee = orderType === 'DELIVERY' ? Number(restaurant?.deliveryFee || 0) : 0;
  const subtotal = getTotal();
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError('');
    try {
      const res = await fetch(
        `${API_URL}/coupons/validate?code=${encodeURIComponent(couponCode)}&restaurantId=${restaurantId}&orderTotal=${subtotal}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cupom inválido');
      const disc = data.discountType === 'PERCENTAGE'
        ? (subtotal * data.discountValue) / 100
        : data.discountValue;
      setCouponDiscount(Math.min(disc, subtotal));
    } catch (e: any) {
      setCouponError(e.message); setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) { setError('Preencha seu nome e telefone'); return; }
    if (orderType === 'DELIVERY' && !address.trim()) { setError('Preencha o endereço de entrega'); return; }
    setLoading(true); setError('');
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
          customerEmail: email || undefined,
          customerBirthDate: birthDate || undefined,
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

      // Save customer to localStorage for next order
      const toSave: SavedCustomer = { name, phone, email, address, birthDate, customerId: data.customerId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

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
      if (paymentMethod !== 'PIX') router.push(`/r/${slug}/order/${newOrderId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // PIX success screen
  if (pixData && orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 max-w-sm w-full text-center space-y-4">
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
            <span className="text-2xl font-bold" style={{ color: primaryColor }}>{fmt(total)}</span>
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
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/r/${slug}/cart`} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">Finalizar pedido</h1>
          <div className="ml-auto flex items-center gap-1">
            {(['info', 'payment', 'confirm'] as const).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'w-6' : ''
                }`}
                style={{ backgroundColor: step === s ? primaryColor : '#e5e7eb' }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-36">

        {/* ── Welcome back banner ── */}
        {showWelcomeBack && savedCustomer && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">Olá de volta, {savedCustomer.name.split(' ')[0]}! 👋</p>
              <p className="text-xs text-gray-500">Seus dados foram preenchidos automaticamente</p>
            </div>
            <button onClick={clearSavedData} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">
              Não sou eu
            </button>
          </div>
        )}

        {/* ── Auto-fill suggestion from DB lookup ── */}
        {foundCustomer && !showWelcomeBack && (
          <div className="rounded-2xl p-4 bg-blue-50 border border-blue-200 flex items-center gap-3">
            <User size={18} className="text-blue-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Encontramos você! 🎉</p>
              <p className="text-xs text-gray-500">Usar os dados de <strong>{foundCustomer.name}</strong>?</p>
            </div>
            <button
              onClick={applyFoundCustomer}
              className="text-sm font-bold text-blue-600 shrink-0"
            >
              Sim!
            </button>
          </div>
        )}

        {/* ── Order Type ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Como você quer receber?</h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'DELIVERY', label: 'Entrega', icon: MapPin },
              { value: 'TAKEOUT', label: 'Retirada', icon: Store },
              { value: 'DINE_IN', label: 'Mesa', icon: Utensils },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setOrderType(value)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-semibold"
                style={
                  orderType === value
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12`, color: primaryColor }
                    : { borderColor: '#e5e7eb', color: '#9ca3af' }
                }
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Customer info ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Seus dados</h3>

          {/* Phone first — triggers lookup */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone size={15} />
            </div>
            <input
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="WhatsApp * (obrigatório)"
              type="tel"
              inputMode="numeric"
              className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 text-sm outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
            {lookingUp && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={14} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={15} /></div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome *"
              className="w-full border border-gray-200 rounded-xl pl-9 py-3 text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={15} /></div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail (para promoções e recibos)"
              type="email"
              inputMode="email"
              className="w-full border border-gray-200 rounded-xl pl-9 py-3 text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Gift size={15} /></div>
            <input
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              type="date"
              className="w-full border border-gray-200 rounded-xl pl-9 py-3 text-sm outline-none focus:ring-2 text-gray-700"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
            {!birthDate && (
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                Data de nascimento (ganhe desconto no aniversário 🎂)
              </span>
            )}
          </div>

          {orderType === 'DELIVERY' && (
            <div className="relative">
              <div className="absolute left-3 top-3.5 text-gray-400"><MapPin size={15} /></div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Endereço completo de entrega *&#10;Rua, número, bairro, complemento..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
            </div>
          )}
        </div>

        {/* ── Payment ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Forma de pagamento</h3>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'PIX', label: 'PIX', sub: 'Aprovação instantânea' },
              { value: 'CREDIT_CARD', label: 'Crédito', sub: 'Cartão de crédito' },
              { value: 'DEBIT_CARD', label: 'Débito', sub: 'Cartão de débito' },
              { value: 'CASH', label: 'Dinheiro', sub: 'Pagar na entrega' },
            ] as const).map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className="py-3 px-3 rounded-xl border-2 text-left transition-all"
                style={
                  paymentMethod === value
                    ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                    : { borderColor: '#e5e7eb' }
                }
              >
                <p className="text-sm font-bold" style={{ color: paymentMethod === value ? primaryColor : '#374151' }}>{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Coupon ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-1.5">
            <Tag size={14} />
            Cupom de desconto
          </h3>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Código do cupom"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none uppercase tracking-widest"
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
            <p className="text-green-600 text-xs mt-2 font-semibold flex items-center gap-1">
              <Check size={12} /> Desconto de {fmt(couponDiscount)} aplicado!
            </p>
          )}
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Resumo do pedido</h3>
          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-gray-600">
                <span>{item.quantity}x {item.name}</span>
                <span>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-200 mt-3 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Taxa de entrega</span><span>{fmt(deliveryFee)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Desconto</span><span>-{fmt(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>Total</span>
              <span style={{ color: primaryColor }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-2xl">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 transition-all active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Enviando pedido...</>
            ) : (
              <><Check size={18} /> Confirmar pedido • {fmt(total)}</>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Seus dados ficam salvos para o próximo pedido 🔒
          </p>
        </div>
      </div>
    </div>
  );
}
