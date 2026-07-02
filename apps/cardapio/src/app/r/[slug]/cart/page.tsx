'use client';
import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../../../lib/cart.store';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart, addItem, restaurantId } = useCartStore();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#FF6B00');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/public/menu/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.restaurant) return;
        setRestaurant(data.restaurant);
        if (data.restaurant.primaryColor) setPrimaryColor(data.restaurant.primaryColor);

        const cartIds = new Set(items.map((i) => i.productId));
        const all: any[] = [];
        for (const cat of data.categories ?? []) {
          for (const p of cat.products ?? []) {
            if (!cartIds.has(p.id) && p.isAvailable !== false) {
              all.push(p);
            }
          }
        }
        // shuffle and pick up to 8
        const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 8);
        setSuggestions(shuffled);
      })
      .catch(() => {});
  }, [slug, items.length]);

  const handleQuickAdd = (product: any) => {
    if (!restaurant) return;
    const hasVariations = product.variations?.some((v: any) => v.options?.length > 0 && v.required);
    if (hasVariations) {
      router.push(`/r/${slug}?open=${product.id}`);
      return;
    }
    addItem(
      { productId: product.id, name: product.name, price: Number(product.promotionalPrice || product.price), quantity: 1 },
      restaurant.id,
      slug,
    );
    setAddedIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds((prev) => { const s = new Set(prev); s.delete(product.id); return s; }), 1500);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <ShoppingBag size={64} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Sua sacola está vazia</h2>
        <p className="text-gray-500 text-sm">Adicione itens do cardápio para continuar</p>
        <Link
          href={`/r/${slug}`}
          className="mt-4 px-6 py-3 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Ver cardápio
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/r/${slug}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Minha sacola</h1>
            <p className="text-xs text-gray-400">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-36">

        {/* Cart items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className={`p-4 flex gap-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                {item.options && item.options.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {item.options.map((o) => o.name).join(', ')}
                  </p>
                )}
                {item.addons && item.addons.filter((a) => a.quantity > 0).length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    + {item.addons.filter((a) => a.quantity > 0).map((a) => `${a.quantity}x ${a.name}`).join(', ')}
                  </p>
                )}
                {item.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{item.notes}"</p>}
                <p className="text-sm font-bold mt-1.5" style={{ color: primaryColor }}>{fmt(item.price)}<span className="text-gray-400 font-normal"> /un</span></p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={12} className="text-gray-600" />
                  </button>
                  <span className="font-bold text-gray-900 w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-800">{fmt(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Resumo</h3>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
            <span className="font-semibold text-gray-800">{fmt(subtotal)}</span>
          </div>
          <div className="border-t border-dashed border-gray-100 pt-3 flex justify-between font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-lg" style={{ color: primaryColor }}>{fmt(subtotal)}</span>
          </div>
        </div>

        {/* ── Upsell section ── */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: primaryColor }} />
              <h3 className="font-bold text-gray-900 text-sm">Aproveite e adicione</h3>
              <span className="text-xs text-gray-400">mais itens na sacola</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {suggestions.map((product) => {
                const isAdded = addedIds.has(product.id);
                const isPromo = product.promotionalPrice && Number(product.promotionalPrice) < Number(product.price);
                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm overflow-hidden"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-28 object-cover"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-3xl">🍽️</div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold" style={{ color: primaryColor }}>
                          {fmt(Number(product.promotionalPrice || product.price))}
                        </span>
                        {isPromo && (
                          <span className="text-[9px] text-gray-400 line-through">{fmt(Number(product.price))}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleQuickAdd(product)}
                        className="mt-2 w-full py-1.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
                        style={{ backgroundColor: isAdded ? '#22c55e' : primaryColor }}
                      >
                        {isAdded ? '✓ Adicionado' : '+ Adicionar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Clear cart */}
        <button
          onClick={() => { clearCart(); router.push(`/r/${slug}`); }}
          className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-2"
        >
          Esvaziar sacola
        </button>
      </div>

      {/* Checkout CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40">
        <div className="max-w-2xl mx-auto">
          <Link href={`/r/${slug}/checkout`}>
            <button
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-between px-6 shadow-lg transition-transform active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-sm opacity-80">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
              <span>Finalizar pedido</span>
              <span className="font-extrabold">{fmt(subtotal)}</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
