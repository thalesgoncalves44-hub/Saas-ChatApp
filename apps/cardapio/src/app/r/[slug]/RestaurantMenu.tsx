'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Clock, MapPin, X, Plus, Minus, Check, ChevronRight, Flame } from 'lucide-react';
import { useCartStore } from '../../../lib/cart.store';

interface Props {
  restaurant: any;
  categories: any[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function RestaurantMenu({ restaurant, categories }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id || null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const { addItem, items, getTotal, getItemCount } = useCartStore();
  const primaryColor = restaurant.primaryColor || '#FF6B00';

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    products: cat.products.filter((p: any) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.products.length > 0);

  const openProduct = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
    setNotes('');
    // set defaults
    const defaults: Record<string, string> = {};
    product.variations?.forEach((v: any) => {
      const def = v.options?.find((o: any) => o.isDefault && o.isAvailable !== false);
      if (def) defaults[v.id] = def.id;
    });
    setSelectedOptions(defaults);
    setSelectedAddons({});
    setJustAdded(false);
    // scroll modal to top
    setTimeout(() => modalRef.current?.scrollTo({ top: 0 }), 50);
  };

  // ── price calculation ──
  const optionsExtra = selectedProduct
    ? Object.entries(selectedOptions).reduce((acc, [varId, optId]) => {
        const opt = selectedProduct.variations
          ?.find((v: any) => v.id === varId)
          ?.options?.find((o: any) => o.id === optId);
        return acc + (opt?.priceAdd ?? opt?.price ?? 0);
      }, 0)
    : 0;

  const addonsExtra = selectedProduct
    ? Object.entries(selectedAddons).reduce((acc, [optId, q]) => {
        if (!q) return acc;
        for (const a of selectedProduct.addons ?? []) {
          const opt = a.options?.find((o: any) => o.id === optId);
          if (opt) return acc + (opt.price ?? 0) * q;
        }
        return acc;
      }, 0)
    : 0;

  const basePrice = selectedProduct
    ? Number(selectedProduct.promotionalPrice || selectedProduct.price)
    : 0;
  const unitPrice = basePrice + optionsExtra + addonsExtra;
  const lineTotal = unitPrice * qty;

  const canAdd = selectedProduct
    ? (selectedProduct.variations ?? []).every(
        (v: any) => !v.required || !!selectedOptions[v.id],
      )
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
      })
      .filter(Boolean);

    addItem(
      { productId: selectedProduct.id, name: selectedProduct.name, price: unitPrice, quantity: qty, notes: notes || undefined, options, addons },
      restaurant.id,
      restaurant.slug,
    );
    setJustAdded(true);
    setTimeout(() => {
      setSelectedProduct(null);
      setJustAdded(false);
    }, 900);
  };

  const cartCount = getItemCount();
  const cartTotal = getTotal();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top header ── */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto">
          {restaurant.bannerUrl && (
            <img src={restaurant.bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
          )}
          <div className="p-4 flex items-start gap-3">
            {restaurant.logoUrl && (
              <img
                src={restaurant.logoUrl}
                alt="Logo"
                className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{restaurant.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {restaurant.estimatedTime}min
                </span>
                {Number(restaurant.deliveryFee) > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> Entrega: {fmt(Number(restaurant.deliveryFee))}
                  </span>
                )}
                {Number(restaurant.minimumOrder) > 0 && (
                  <span className="text-gray-400">Mínimo: {fmt(Number(restaurant.minimumOrder))}</span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                    restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {restaurant.isOpen ? '● Aberto' : '● Fechado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-28">

        {/* ── Search ── */}
        <div className="px-4 py-3 bg-white border-b">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none"
            />
          </div>
        </div>

        {/* ── Category pills ── */}
        {!search && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5 bg-white border-b no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={
                  activeCategory === cat.id
                    ? { backgroundColor: primaryColor, color: 'white' }
                    : { backgroundColor: '#f3f4f6', color: '#374151' }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Products ── */}
        <div className="p-4 space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} id={`cat-${category.id}`}>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                {category.name}
                <span className="text-xs text-gray-400 font-normal">{category.products.length} itens</span>
              </h2>
              <div className="space-y-2">
                {category.products.map((product: any) => {
                  const hasVariations = product.variations?.some((v: any) => v.options?.length > 0);
                  const hasAddons = product.addons?.some((a: any) => a.options?.length > 0);
                  const isPromo = product.promotionalPrice && Number(product.promotionalPrice) < Number(product.price);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                      onClick={() => openProduct(product)}
                    >
                      <div className="flex gap-3 p-3.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</h3>
                            {isPromo && (
                              <span className="shrink-0 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">PROMO</span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {isPromo ? (
                              <>
                                <span className="text-base font-bold" style={{ color: primaryColor }}>
                                  {fmt(Number(product.promotionalPrice))}
                                </span>
                                <span className="text-xs text-gray-400 line-through">{fmt(Number(product.price))}</span>
                              </>
                            ) : (
                              <span className="text-base font-bold" style={{ color: primaryColor }}>
                                {fmt(Number(product.price))}
                              </span>
                            )}
                          </div>
                          {(hasVariations || hasAddons) && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                              Personalizável <ChevronRight size={10} />
                            </p>
                          )}
                        </div>
                        <div className="relative flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">🍽️</div>
                          )}
                          <button
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md"
                            style={{ backgroundColor: primaryColor }}
                            onClick={(e) => { e.stopPropagation(); openProduct(product); }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cart FAB ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
          <a href={`/r/${restaurant.slug}/cart`}>
            <button
              className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-between px-5 shadow-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
              >
                {cartCount}
              </span>
              <span>Ver sacola</span>
              <span>{fmt(cartTotal)}</span>
            </button>
          </a>
        </div>
      )}

      {/* ── Product Modal (bottom sheet) ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
          <div
            ref={modalRef}
            className="bg-white w-full max-w-2xl rounded-t-3xl overflow-y-auto"
            style={{ maxHeight: '92vh' }}
          >
            {/* ── Modal header ── */}
            <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-base pr-8 leading-tight">{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 shrink-0"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 pb-6">
              {/* Product image + description */}
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-2xl"
                />
              )}

              <div>
                <div className="flex items-center gap-3">
                  {selectedProduct.promotionalPrice && Number(selectedProduct.promotionalPrice) < Number(selectedProduct.price) ? (
                    <>
                      <span className="text-xl font-extrabold" style={{ color: primaryColor }}>
                        {fmt(Number(selectedProduct.promotionalPrice))}
                      </span>
                      <span className="text-sm text-gray-400 line-through">{fmt(Number(selectedProduct.price))}</span>
                      <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">PROMO</span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold" style={{ color: primaryColor }}>
                      {fmt(Number(selectedProduct.price))}
                    </span>
                  )}
                </div>
                {selectedProduct.description && (
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{selectedProduct.description}</p>
                )}
                {selectedProduct.calories && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Flame size={11} /> {selectedProduct.calories} kcal
                  </p>
                )}
              </div>

              {/* ── Variations (radio) ── */}
              {selectedProduct.variations?.filter((v: any) => v.options?.filter((o: any) => o.isAvailable !== false).length > 0).map((variation: any) => {
                const availableOpts = variation.options.filter((o: any) => o.isAvailable !== false);
                return (
                  <div key={variation.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <span className="font-bold text-gray-800 text-sm">{variation.name}</span>
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={
                          variation.required
                            ? { backgroundColor: `${primaryColor}20`, color: primaryColor }
                            : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                        }
                      >
                        {variation.required ? 'Obrigatório' : 'Opcional'}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {availableOpts.map((option: any) => {
                        const selected = selectedOptions[variation.id] === option.id;
                        return (
                          <label
                            key={option.id}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                                style={selected ? { borderColor: primaryColor, backgroundColor: primaryColor } : { borderColor: '#d1d5db' }}
                              >
                                {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                              <input
                                type="radio"
                                name={variation.id}
                                className="sr-only"
                                checked={selected}
                                onChange={() => setSelectedOptions((p) => ({ ...p, [variation.id]: option.id }))}
                              />
                              <span className="text-sm text-gray-800">{option.name}</span>
                            </div>
                            {(option.priceAdd ?? option.price ?? 0) > 0 && (
                              <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                                +{fmt(option.priceAdd ?? option.price ?? 0)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* ── Add-ons (steppers) ── */}
              {selectedProduct.addons?.filter((a: any) => a.options?.filter((o: any) => o.isAvailable !== false).length > 0).map((addon: any) => {
                const availableOpts = addon.options.filter((o: any) => o.isAvailable !== false);
                const totalSelected = availableOpts.reduce((s: number, o: any) => s + (selectedAddons[o.id] ?? 0), 0);
                return (
                  <div key={addon.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div>
                        <span className="font-bold text-gray-800 text-sm">{addon.name}</span>
                        {addon.required && (
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {totalSelected}/{addon.maxSelect ?? '∞'}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {availableOpts.map((option: any) => {
                        const q = selectedAddons[option.id] ?? 0;
                        const maxReached = addon.maxSelect && totalSelected >= addon.maxSelect;
                        return (
                          <div key={option.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-800">{option.name}</span>
                              {(option.price ?? 0) > 0 && (
                                <span className="text-xs font-semibold ml-2" style={{ color: primaryColor }}>
                                  +{fmt(option.price)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <button
                                onClick={() => setSelectedAddons((p) => ({ ...p, [option.id]: Math.max(0, (p[option.id] ?? 0) - 1) }))}
                                disabled={q === 0}
                                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center transition-opacity disabled:opacity-30"
                              >
                                <Minus size={12} className="text-gray-600" />
                              </button>
                              <span className="w-5 text-center text-sm font-bold text-gray-900">{q}</span>
                              <button
                                onClick={() => {
                                  if (!maxReached)
                                    setSelectedAddons((p) => ({ ...p, [option.id]: (p[option.id] ?? 0) + 1 }));
                                }}
                                disabled={!!maxReached}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-30"
                                style={{ backgroundColor: primaryColor }}
                              >
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

              {/* ── Notes ── */}
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

              {/* ── Qty + CTA ── */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full font-bold text-gray-600"
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-bold text-gray-900">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full font-bold"
                    style={{ color: primaryColor }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!canAdd || justAdded}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-between px-5 transition-all disabled:opacity-60 active:scale-[0.98]"
                  style={{ backgroundColor: justAdded ? '#22c55e' : primaryColor }}
                >
                  <span>{justAdded ? 'Adicionado!' : 'Adicionar'}</span>
                  <span className="flex items-center gap-1">
                    {justAdded && <Check size={14} />}
                    {fmt(lineTotal)}
                  </span>
                </button>
              </div>

              {!canAdd && (
                <p className="text-xs text-red-500 text-center -mt-2">
                  Selecione as opções obrigatórias para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
