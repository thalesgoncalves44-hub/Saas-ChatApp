'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, Plus, Minus, Check, Flame, Play, Star, Users, Zap,
  ChevronRight, ChevronDown, Clock, MapPin, ArrowLeft, Share2,
  CreditCard, Smartphone, Banknote,
} from 'lucide-react';
import { useCartStore } from '../../../lib/cart.store';

// ─── helpers ─────────────────────────────────────────────
function extractYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
function isYouTube(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function useSocialCount(restaurantId: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const seed = restaurantId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = 8 + (seed % 24);
    setCount(base);
    const id = setInterval(() => setCount((c) => Math.max(5, Math.min(base + 18, c + (Math.random() < 0.5 ? 1 : -1)))), 7000);
    return () => clearInterval(id);
  }, [restaurantId]);
  return count;
}

// ─── types ───────────────────────────────────────────────
interface Reviews {
  avg: number;
  total: number;
  recent: { id: string; rating: number; comment?: string; customerName?: string; createdAt: string }[];
}
interface Props {
  restaurant: any;
  categories: any[];
  reviews?: Reviews;
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} fill={s <= rating ? '#f59e0b' : '#d1d5db'} style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }} />
      ))}
    </span>
  );
}

// ─── component ───────────────────────────────────────────
export default function RestaurantMenu({ restaurant, categories, reviews }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id ?? null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const catNavRef = useRef<HTMLDivElement>(null);

  const { addItem, getTotal, getItemCount } = useCartStore();
  const primaryColor = restaurant.primaryColor || '#FF6B00';
  const socialCount = useSocialCount(restaurant.id);
  const hasReviews = (reviews?.total ?? 0) > 0;

  // IntersectionObserver for active category highlight
  useEffect(() => {
    if (search) return;
    const observers: IntersectionObserver[] = [];
    categories.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveCategory(cat.id); },
        { rootMargin: '-30% 0px -60% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [categories, search]);

  const scrollToCategory = useCallback((catId: string) => {
    setActiveCategory(catId);
    const el = document.getElementById(`cat-${catId}`);
    if (!el) return;
    const navH = (catNavRef.current?.offsetHeight ?? 0) + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      products: cat.products.filter((p: any) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.products.length > 0);

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
    setNotes('');
    const defaults: Record<string, string> = {};
    product.variations?.forEach((v: any) => {
      const def = v.options?.find((o: any) => o.isDefault && o.isAvailable !== false);
      if (def) defaults[v.id] = def.id;
    });
    setSelectedOptions(defaults);
    setSelectedAddons({});
    setJustAdded(false);
    setTimeout(() => modalRef.current?.scrollTo({ top: 0 }), 50);
  };

  const optionsExtra = selectedProduct
    ? Object.entries(selectedOptions).reduce((acc, [varId, optId]) => {
        const opt = selectedProduct.variations?.find((v: any) => v.id === varId)?.options?.find((o: any) => o.id === optId);
        return acc + (opt?.priceAdd ?? opt?.price ?? 0);
      }, 0) : 0;

  const addonsExtra = selectedProduct
    ? Object.entries(selectedAddons).reduce((acc, [optId, q]) => {
        if (!q) return acc;
        for (const a of selectedProduct.addons ?? []) {
          const opt = a.options?.find((o: any) => o.id === optId);
          if (opt) return acc + (opt.price ?? 0) * q;
        }
        return acc;
      }, 0) : 0;

  const basePrice = selectedProduct ? Number(selectedProduct.promotionalPrice || selectedProduct.price) : 0;
  const unitPrice = basePrice + optionsExtra + addonsExtra;
  const lineTotal = unitPrice * qty;
  const canAdd = selectedProduct
    ? (selectedProduct.variations ?? []).every((v: any) => !v.required || !!selectedOptions[v.id])
    : false;

  const handleAddToCart = () => {
    if (!selectedProduct || !canAdd) return;
    const options = Object.entries(selectedOptions).map(([varId, optId]) => {
      const v = selectedProduct.variations?.find((x: any) => x.id === varId);
      const o = v?.options?.find((x: any) => x.id === optId);
      return { variationOptionId: optId, name: o?.name || '', price: o?.priceAdd ?? o?.price ?? 0 };
    });
    const addons = Object.entries(selectedAddons)
      .filter(([, q]) => q > 0)
      .map(([optId, quantity]) => {
        for (const a of selectedProduct.addons ?? []) {
          const o = a.options?.find((x: any) => x.id === optId);
          if (o) return { addonOptionId: optId, name: o.name, price: o.price ?? 0, quantity };
        }
        return null;
      }).filter(Boolean);
    addItem(
      { productId: selectedProduct.id, name: selectedProduct.name, price: unitPrice, quantity: qty, notes: notes || undefined, options, addons },
      restaurant.id, restaurant.slug,
    );
    setJustAdded(true);
    setTimeout(() => { setSelectedProduct(null); setJustAdded(false); }, 900);
  };

  const cartCount = getItemCount();
  const cartTotal = getTotal();

  // ── payment methods from restaurant data ──
  const paymentMethods = [
    { key: 'pix', label: 'Pix', sub: 'Pagamento online', icon: '⚡', show: !!restaurant.pixKey },
    { key: 'card', label: 'Cartão', sub: 'Crédito / Débito', icon: '💳', show: true },
    { key: 'cash', label: 'Dinheiro', sub: 'Na entrega / retirada', icon: '💵', show: true },
  ].filter((m) => m.show);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ══ HERO BANNER ══ */}
      <div className="relative">
        {/* Banner image or gradient */}
        <div
          className="w-full h-44 relative overflow-hidden"
          style={
            restaurant.bannerUrl
              ? { backgroundImage: `url(${restaurant.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)` }
          }
        >
          <div className="absolute inset-0 bg-black/20" />
          {/* Social proof — top left */}
          {socialCount > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-xs font-semibold">{socialCount} vendo agora</span>
            </div>
          )}
          {/* Share button — top right */}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => {
              if (navigator.share) navigator.share({ title: restaurant.name, url: window.location.href });
              else navigator.clipboard?.writeText(window.location.href);
            }}
          >
            <Share2 size={14} className="text-white" />
          </button>
        </div>

        {/* ── WHITE PROFILE CARD ── */}
        <div className="bg-white">
          {/* Logo + name row */}
          <div className="flex items-end gap-3 px-4 pt-0 pb-3" style={{ marginTop: '-28px' }}>
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt="Logo"
                className="w-[56px] h-[56px] rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
              />
            ) : (
              <div
                className="w-[56px] h-[56px] rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-extrabold text-xl flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {restaurant.name?.[0] ?? '🍔'}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="font-extrabold text-gray-900 text-lg leading-tight">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-xs text-gray-500 line-clamp-1">{restaurant.description}</p>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div
            className="mx-4 mb-3 rounded-lg px-3 py-2 text-sm font-semibold text-white text-center"
            style={{ backgroundColor: restaurant.isOpen ? '#16a34a' : '#dc2626' }}
          >
            {restaurant.isOpen ? '● Aberto agora' : '● Loja fechada'}
          </div>

          {/* Info row */}
          <div className="flex items-center justify-between px-4 pb-3 text-xs text-gray-500">
            <div className="flex items-center gap-3 flex-wrap">
              {Number(restaurant.minimumOrder) > 0 ? (
                <span>Mínimo: {fmt(Number(restaurant.minimumOrder))}</span>
              ) : (
                <span className="text-green-600 font-semibold">Sem pedido mínimo</span>
              )}
              {Number(restaurant.deliveryFee) > 0 && (
                <span className="flex items-center gap-0.5">
                  <MapPin size={10} /> {fmt(Number(restaurant.deliveryFee))}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Clock size={10} /> {restaurant.estimatedTime ?? 30}min
              </span>
            </div>
            <button
              onClick={() => setShowProfile(true)}
              className="text-xs font-semibold"
              style={{ color: primaryColor }}
            >
              Perfil da loja
            </button>
          </div>

          {/* Rating summary strip (if has reviews) */}
          {hasReviews && (
            <button
              className="w-full px-4 pb-3 flex items-center gap-2 text-left"
              onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Stars rating={Math.round(reviews!.avg)} size={13} />
              <span className="text-sm font-bold text-gray-900">{reviews!.avg}</span>
              <span className="text-xs text-gray-400">({reviews!.total} avaliações)</span>
              <ChevronRight size={12} className="text-gray-400 ml-auto" />
            </button>
          )}
        </div>
      </div>

      {/* ══ SEARCH + CATEGORY NAV (sticky) ══ */}
      <div ref={catNavRef} className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-2.5 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-8 pr-8 py-2 bg-gray-100 rounded-full text-sm outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={13} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {!search && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: primaryColor, color: 'white' }
                    : { backgroundColor: '#f3f4f6', color: '#374151' }
                }
              >
                {cat.name}
              </button>
            ))}
            {hasReviews && (
              <button
                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 whitespace-nowrap"
              >
                <Star size={10} fill="currentColor" /> Avaliações
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ PRODUCTS ══ */}
      <div className="max-w-2xl mx-auto px-3 pt-4 pb-32 space-y-7">
        {filteredCategories.map((category) => (
          <div key={category.id} id={`cat-${category.id}`}>
            {/* Category title */}
            <h2 className="text-base font-extrabold text-gray-900 mb-3 tracking-tight">{category.name}</h2>

            {/* Grid: 2 columns */}
            <div className="space-y-2">
              {category.products.map((product: any) => {
                const isPromo = product.promotionalPrice && Number(product.promotionalPrice) < Number(product.price);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex cursor-pointer active:scale-[0.99] transition-transform"
                    onClick={() => openProduct(product)}
                  >
                    {/* Text left */}
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                      <div>
                        {isPromo && (
                          <span className="inline-block text-[9px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase mb-1">
                            Promo
                          </span>
                        )}
                        <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{product.name}</p>
                        {product.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {isPromo ? (
                            <div>
                              <span className="text-sm font-extrabold" style={{ color: primaryColor }}>
                                {fmt(Number(product.promotionalPrice))}
                              </span>
                              <span className="text-[10px] text-gray-400 line-through ml-1">
                                {fmt(Number(product.price))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-extrabold" style={{ color: primaryColor }}>
                              {fmt(Number(product.price))}
                            </span>
                          )}
                        </div>
                        <button
                          className="w-7 h-7 rounded-full text-white flex items-center justify-center shadow"
                          style={{ backgroundColor: primaryColor }}
                          onClick={(e) => { e.stopPropagation(); openProduct(product); }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Image right */}
                    {product.imageUrl ? (
                      <div className="relative flex-shrink-0 w-[100px]">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          style={{ minHeight: '90px' }}
                        />
                        {product.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center">
                              <Play size={11} className="text-gray-900 ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-[100px] flex-shrink-0 bg-gray-50 flex items-center justify-center text-3xl" style={{ minHeight: '90px' }}>
                        🍽️
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ══ REVIEWS SECTION ══ */}
        {hasReviews && (
          <div id="reviews">
            <h2 className="text-base font-extrabold text-gray-900 mb-3 tracking-tight flex items-center gap-2">
              <Star size={15} fill="#f59e0b" style={{ color: '#f59e0b' }} />
              Avaliações dos clientes
            </h2>

            {/* Summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3">
              <div className="flex gap-4 items-center">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-5xl font-extrabold text-gray-900 leading-none">{reviews!.avg}</span>
                  <Stars rating={Math.round(reviews!.avg)} size={16} />
                  <span className="text-[10px] text-gray-400 mt-1">{reviews!.total} avaliações</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews!.recent.filter((r) => r.rating === star).length;
                    const pct = reviews!.recent.length ? (count / reviews!.recent.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-3 text-right">{star}</span>
                        <Star size={8} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#f59e0b' }} />
                        </div>
                        <span className="text-[10px] text-gray-400 w-3">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {reviews!.recent.length >= 3 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5">
                  <Zap size={12} style={{ color: primaryColor }} />
                  <span className="text-xs font-semibold text-gray-700">
                    {Math.round((reviews!.recent.filter((r) => r.rating >= 4).length / reviews!.recent.length) * 100)}% dos clientes recomendam
                  </span>
                </div>
              )}
            </div>

            {/* Recent review cards */}
            <div className="space-y-2">
              {(showAllReviews ? reviews!.recent : reviews!.recent.slice(0, 3)).map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(r.customerName || 'A')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">{r.customerName || 'Cliente'}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(r.createdAt)}</span>
                      </div>
                      <Stars rating={r.rating} size={11} />
                      {r.comment && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">"{r.comment}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reviews!.recent.length > 3 && !showAllReviews && (
              <button
                onClick={() => setShowAllReviews(true)}
                className="mt-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 flex items-center justify-center gap-1 bg-white"
              >
                Ver todas <ChevronDown size={14} />
              </button>
            )}
          </div>
        )}

        {/* Social proof footer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Users size={14} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900">
              <span style={{ color: primaryColor }}>{socialCount} pessoas</span> estão vendo esse cardápio agora
            </p>
            <p className="text-[10px] text-gray-400">Faça seu pedido antes que acabe!</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        </div>
      </div>

      {/* ══ CART FAB ══ */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
          <a href={`/r/${restaurant.slug}/cart`}>
            <button
              className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-between px-5 shadow-2xl"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
                {cartCount}
              </span>
              <span>Ver sacola</span>
              <span>{fmt(cartTotal)}</span>
            </button>
          </a>
        </div>
      )}

      {/* ══ PERFIL DA LOJA MODAL ══ */}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowProfile(false)} className="p-1">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h2 className="font-bold text-gray-900">Perfil da loja</h2>
          </div>

          {/* Banner */}
          <div
            className="w-full h-40"
            style={
              restaurant.bannerUrl
                ? { backgroundImage: `url(${restaurant.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)` }
            }
          />

          {/* Logo + name */}
          <div className="flex items-end gap-3 px-4 pb-3" style={{ marginTop: '-24px' }}>
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-extrabold flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                {restaurant.name?.[0]}
              </div>
            )}
            <div className="pb-1">
              <h3 className="font-extrabold text-gray-900">{restaurant.name}</h3>
            </div>
          </div>

          {/* Status bar */}
          <div
            className="mx-4 mb-4 rounded-lg px-3 py-2 text-sm font-semibold text-white text-center"
            style={{ backgroundColor: restaurant.isOpen ? '#16a34a' : '#dc2626' }}
          >
            {restaurant.isOpen ? '● Aberto agora' : '● Loja fechada'}
          </div>

          <div className="px-4 space-y-4 pb-10">
            {/* Reviews */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Avaliações</p>
              {hasReviews ? (
                <>
                  {/* Summary */}
                  <div className="flex gap-4 items-center mb-4">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-4xl font-extrabold text-gray-900 leading-none">{reviews!.avg}</span>
                      <Stars rating={Math.round(reviews!.avg)} size={14} />
                      <span className="text-[10px] text-gray-400 mt-1">{reviews!.total} avaliações</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews!.recent.filter((r) => r.rating === star).length;
                        const pct = reviews!.recent.length ? (count / reviews!.recent.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-3 text-right">{star}</span>
                            <Star size={8} fill="#f59e0b" style={{ color: '#f59e0b' }} />
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#f59e0b' }} />
                            </div>
                            <span className="text-[10px] text-gray-400 w-3">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Recent reviews */}
                  <div className="space-y-2">
                    {reviews!.recent.slice(0, 5).map((r) => (
                      <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-3">
                        <div className="flex items-start gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {(r.customerName || 'A')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-gray-900 truncate">{r.customerName || 'Cliente'}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(r.createdAt)}</span>
                            </div>
                            <Stars rating={r.rating} size={10} />
                            {r.comment && (
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">"{r.comment}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Star size={28} className="mx-auto mb-2 text-gray-300" fill="currentColor" style={{ color: '#d1d5db' }} />
                  <p className="text-sm text-gray-400">Ainda sem avaliações</p>
                  <p className="text-xs text-gray-300 mt-0.5">As avaliações aparecem após os primeiros pedidos</p>
                </div>
              )}
            </div>

            {/* Address */}
            {restaurant.address && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Endereço</p>
                <p className="text-sm text-gray-700">{restaurant.address}</p>
                {restaurant.city && <p className="text-sm text-gray-500">{restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ''}</p>}
              </div>
            )}

            {/* Operating hours */}
            {restaurant.operatingHours?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Horário de atendimento</p>
                <div className="space-y-2">
                  {restaurant.operatingHours.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{DAY_NAMES[h.dayOfWeek]}</span>
                      {h.isOpen ? (
                        <span className="text-gray-900 font-semibold">{h.openTime} às {h.closeTime}</span>
                      ) : (
                        <span className="text-red-500 font-medium">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order types */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tipos de pedido</p>
              <div className="space-y-2">
                {restaurant.acceptsDelivery && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin size={14} className="text-gray-400" /> Delivery
                    {Number(restaurant.deliveryFee) > 0
                      ? <span className="text-gray-500 text-xs">— {fmt(Number(restaurant.deliveryFee))}</span>
                      : <span className="text-green-600 text-xs font-semibold">— Grátis</span>}
                  </div>
                )}
                {restaurant.acceptsTakeaway && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-gray-400">🏪</span> Retirada no local
                  </div>
                )}
                {restaurant.acceptsDineIn && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-gray-400">🍽️</span> Consumo no local
                  </div>
                )}
              </div>
            </div>

            {/* Payment methods */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Formas de pagamento</p>
              <div className="space-y-3">
                {paymentMethods.map((m) => (
                  <div key={m.key} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm">
                      {m.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Min order / estimated time */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informações</p>
              <div className="space-y-2 text-sm text-gray-700">
                {Number(restaurant.minimumOrder) > 0 ? (
                  <p>Pedido mínimo: <span className="font-semibold">{fmt(Number(restaurant.minimumOrder))}</span></p>
                ) : (
                  <p className="text-green-600 font-semibold">Sem pedido mínimo</p>
                )}
                <p>Tempo estimado: <span className="font-semibold">{restaurant.estimatedTime ?? 30} min</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ VIDEO FULLSCREEN ══ */}
      {videoFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col" onClick={() => setVideoFullscreen(null)}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <span className="text-white font-semibold text-sm opacity-80">Vídeo do produto</span>
            <button onClick={() => setVideoFullscreen(null)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <X size={18} className="text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            {isYouTube(videoFullscreen) ? (
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(videoFullscreen)}?autoplay=1&playsinline=1`}
                className="w-full rounded-xl"
                style={{ aspectRatio: '9/16', maxHeight: '80vh' }}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <video src={videoFullscreen} autoPlay controls playsInline className="w-full rounded-xl" style={{ maxHeight: '80vh' }} />
            )}
          </div>
        </div>
      )}

      {/* ══ PRODUCT MODAL ══ */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
          <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-t-3xl overflow-y-auto" style={{ maxHeight: '92vh' }}>
            {/* Handle + close */}
            <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-base pr-8 leading-tight">{selectedProduct.name}</h2>
                <button onClick={() => setSelectedProduct(null)} className="p-1.5 rounded-full hover:bg-gray-100 shrink-0">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 pb-6">
              {/* Image + video */}
              {selectedProduct.imageUrl && (
                <div className="relative">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-52 object-cover rounded-2xl" />
                  {selectedProduct.videoUrl && (
                    <button
                      onClick={() => setVideoFullscreen(selectedProduct.videoUrl)}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 hover:bg-black/40 transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                        <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
                      </div>
                    </button>
                  )}
                </div>
              )}
              {!selectedProduct.imageUrl && selectedProduct.videoUrl && (
                <button
                  onClick={() => setVideoFullscreen(selectedProduct.videoUrl)}
                  className="w-full h-32 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Play size={18} fill="currentColor" /> Ver vídeo do produto
                </button>
              )}

              {/* Price + description */}
              <div>
                <div className="flex items-center gap-3">
                  {selectedProduct.promotionalPrice && Number(selectedProduct.promotionalPrice) < Number(selectedProduct.price) ? (
                    <>
                      <span className="text-xl font-extrabold" style={{ color: primaryColor }}>{fmt(Number(selectedProduct.promotionalPrice))}</span>
                      <span className="text-sm text-gray-400 line-through">{fmt(Number(selectedProduct.price))}</span>
                      <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">PROMO</span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold" style={{ color: primaryColor }}>{fmt(Number(selectedProduct.price))}</span>
                  )}
                </div>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{selectedProduct.description}</p>
                )}
                {selectedProduct.calories && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Flame size={11} /> {selectedProduct.calories} kcal</p>
                )}
              </div>

              {/* Variations */}
              {selectedProduct.variations
                ?.filter((v: any) => v.options?.filter((o: any) => o.isAvailable !== false).length > 0)
                .map((variation: any) => {
                  const availableOpts = variation.options.filter((o: any) => o.isAvailable !== false);
                  return (
                    <div key={variation.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <span className="font-bold text-gray-800 text-sm">{variation.name}</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={variation.required ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                          {variation.required ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {availableOpts.map((option: any) => {
                          const selected = selectedOptions[variation.id] === option.id;
                          return (
                            <label key={option.id} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={selected ? { borderColor: primaryColor, backgroundColor: primaryColor } : { borderColor: '#d1d5db' }}>
                                  {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <input type="radio" name={variation.id} className="sr-only" checked={selected} onChange={() => setSelectedOptions((p) => ({ ...p, [variation.id]: option.id }))} />
                                <span className="text-sm text-gray-800">{option.name}</span>
                              </div>
                              {(option.priceAdd ?? option.price ?? 0) > 0 && (
                                <span className="text-sm font-semibold" style={{ color: primaryColor }}>+{fmt(option.priceAdd ?? option.price ?? 0)}</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Add-ons */}
              {selectedProduct.addons
                ?.filter((a: any) => a.options?.filter((o: any) => o.isAvailable !== false).length > 0)
                .map((addon: any) => {
                  const availableOpts = addon.options.filter((o: any) => o.isAvailable !== false);
                  const totalSelected = availableOpts.reduce((s: number, o: any) => s + (selectedAddons[o.id] ?? 0), 0);
                  return (
                    <div key={addon.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div>
                          <span className="font-bold text-gray-800 text-sm">{addon.name}</span>
                          {addon.required && <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>Obrigatório</span>}
                        </div>
                        <span className="text-xs text-gray-500">{totalSelected}/{addon.maxSelect ?? '∞'}</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {availableOpts.map((option: any) => {
                          const q = selectedAddons[option.id] ?? 0;
                          const maxReached = addon.maxSelect && totalSelected >= addon.maxSelect;
                          return (
                            <div key={option.id} className="flex items-center justify-between px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-800">{option.name}</span>
                                {(option.price ?? 0) > 0 && <span className="text-xs font-semibold ml-2" style={{ color: primaryColor }}>+{fmt(option.price)}</span>}
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                <button onClick={() => setSelectedAddons((p) => ({ ...p, [option.id]: Math.max(0, (p[option.id] ?? 0) - 1) }))} disabled={q === 0} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30">
                                  <Minus size={12} className="text-gray-600" />
                                </button>
                                <span className="w-5 text-center text-sm font-bold text-gray-900">{q}</span>
                                <button onClick={() => { if (!maxReached) setSelectedAddons((p) => ({ ...p, [option.id]: (p[option.id] ?? 0) + 1 })); }} disabled={!!maxReached} className="w-7 h-7 rounded-full flex items-center justify-center text-white disabled:opacity-30" style={{ backgroundColor: primaryColor }}>
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Alguma observação?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: sem cebola, ponto bem passado, tirar o molho..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-orange-400"
                />
              </div>

              {/* Qty + CTA */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 flex items-center justify-center rounded-full font-bold text-gray-600">−</button>
                  <span className="w-5 text-center font-bold text-gray-900">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="w-7 h-7 flex items-center justify-center rounded-full font-bold" style={{ color: primaryColor }}>+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!canAdd || justAdded}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-between px-5 transition-all disabled:opacity-60 active:scale-[0.98]"
                  style={{ backgroundColor: justAdded ? '#22c55e' : primaryColor }}
                >
                  <span>{justAdded ? 'Adicionado!' : 'Adicionar'}</span>
                  <span className="flex items-center gap-1">{justAdded && <Check size={14} />}{fmt(lineTotal)}</span>
                </button>
              </div>
              {!canAdd && (
                <p className="text-xs text-red-500 text-center -mt-2">Selecione as opções obrigatórias para continuar</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
