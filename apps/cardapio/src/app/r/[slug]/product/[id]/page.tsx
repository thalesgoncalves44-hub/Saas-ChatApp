'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart.store';

interface VariationOption { id: string; name: string; priceAdd: number; isDefault: boolean; isAvailable: boolean; }
interface Variation { id: string; name: string; required: boolean; minSelect: number; maxSelect: number; options: VariationOption[]; }
interface AddonOption { id: string; name: string; price: number; isAvailable: boolean; }
interface Addon { id: string; name: string; required: boolean; maxSelect: number; options: AddonOption[]; }
interface Product {
  id: string; name: string; description?: string; imageUrl?: string;
  price: number; originalPrice?: number; calories?: number;
  isVegetarian: boolean; isVegan: boolean; isGlutenFree: boolean; isLactoseFree: boolean; isSpicy: boolean;
  variations: Variation[]; addons: Addon[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`${API}/public/r/${slug}/menu`)
      .then(r => r.json())
      .then((data) => {
        const allProducts: Product[] = data.categories?.flatMap((c: any) => c.products ?? []) ?? [];
        const found = allProducts.find((p: Product) => p.id === id);
        if (found) {
          setProduct(found);
          const defaults: Record<string, string> = {};
          found.variations?.forEach(v => {
            const def = v.options.find(o => o.isDefault && o.isAvailable);
            if (def) defaults[v.id] = def.id;
          });
          setSelectedOptions(defaults);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">Produto não encontrado.</p>
      <button onClick={() => router.back()} className="text-orange-500 font-semibold">← Voltar</button>
    </div>
  );

  const optionsTotal = Object.entries(selectedOptions).reduce((acc, [varId, optId]) => {
    const opt = product.variations.find(v => v.id === varId)?.options.find(o => o.id === optId);
    return acc + (opt?.priceAdd ?? 0);
  }, 0);

  const addonsTotal = Object.entries(selectedAddons).reduce((acc, [optId, q]) => {
    if (!q) return acc;
    for (const a of product.addons) {
      const opt = a.options.find(o => o.id === optId);
      if (opt) return acc + opt.price * q;
    }
    return acc;
  }, 0);

  const unitPrice = product.price + optionsTotal + addonsTotal;
  const total = unitPrice * qty;
  const canAdd = product.variations.every(v => !v.required || !!selectedOptions[v.id]);

  const handleAdd = () => {
    if (!canAdd) return;
    const options = Object.entries(selectedOptions).map(([varId, optId]) => {
      const v = product.variations.find(x => x.id === varId)!;
      const o = v.options.find(x => x.id === optId)!;
      return { optionId: optId, name: o.name, priceAdd: o.priceAdd };
    });
    const addons = Object.entries(selectedAddons).filter(([, q]) => q > 0).map(([optId, quantity]) => {
      for (const a of product.addons) {
        const o = a.options.find(x => x.id === optId);
        if (o) return { addonId: optId, name: o.name, price: o.price, quantity };
      }
      return null;
    }).filter(Boolean) as any[];

    addItem({ productId: product.id, name: product.name, quantity: qty, unitPrice, totalPrice: total, notes, options, addons, imageUrl: product.imageUrl });
    setAdded(true);
    setTimeout(() => router.push(`/r/${slug}`), 1200);
  };

  const SEALS = [
    { key: 'isVegetarian', label: '🥦 Vegetariano' }, { key: 'isVegan', label: '🌱 Vegano' },
    { key: 'isGlutenFree', label: '🌾 Sem Glúten' }, { key: 'isLactoseFree', label: '🥛 Sem Lactose' }, { key: 'isSpicy', label: '🌶️ Picante' },
  ];

  return (
    <div className="min-h-screen bg-white pb-36">
      <div className="relative">
        <button onClick={() => router.back()} className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md text-gray-700 text-xl">←</button>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover" />
          : <div className="w-full h-64 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-7xl">🍽️</div>
        }
      </div>

      <div className="p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold text-orange-500">{fmt(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-gray-400 line-through text-sm">{fmt(product.originalPrice)}</span>
            )}
          </div>
          {product.description && <p className="text-gray-500 mt-2 text-sm leading-relaxed">{product.description}</p>}
          {product.calories && <p className="text-xs text-gray-400 mt-1">🔥 {product.calories} kcal</p>}
        </div>

        {SEALS.filter(s => (product as any)[s.key]).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {SEALS.filter(s => (product as any)[s.key]).map(s => (
              <span key={s.key} className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">{s.label}</span>
            ))}
          </div>
        )}

        {product.variations?.map(variation => (
          <div key={variation.id} className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800">{variation.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${variation.required ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                {variation.required ? 'Obrigatório' : 'Opcional'}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {variation.options.filter(o => o.isAvailable).map(option => (
                <label key={option.id} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input type="radio" name={variation.id} checked={selectedOptions[variation.id] === option.id}
                      onChange={() => setSelectedOptions(p => ({ ...p, [variation.id]: option.id }))}
                      className="accent-orange-500 w-4 h-4" />
                    <span className="text-sm text-gray-800">{option.name}</span>
                  </div>
                  {option.priceAdd > 0 && <span className="text-sm text-orange-500 font-semibold">+{fmt(option.priceAdd)}</span>}
                </label>
              ))}
            </div>
          </div>
        ))}

        {product.addons?.map(addon => (
          <div key={addon.id} className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800">{addon.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Até {addon.maxSelect}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {addon.options.filter(o => o.isAvailable).map(option => {
                const q = selectedAddons[option.id] ?? 0;
                const totalSel = addon.options.reduce((s, o) => s + (selectedAddons[o.id] ?? 0), 0);
                return (
                  <div key={option.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="text-sm text-gray-800">{option.name}</span>
                      {option.price > 0 && <span className="text-xs text-orange-500 font-semibold ml-2">+{fmt(option.price)}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedAddons(p => ({ ...p, [option.id]: Math.max(0, (p[option.id] ?? 0) - 1) }))} disabled={q === 0}
                        className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center disabled:opacity-30">−</button>
                      <span className="w-5 text-center text-sm font-bold">{q}</span>
                      <button onClick={() => { if (totalSel < addon.maxSelect) setSelectedAddons(p => ({ ...p, [option.id]: (p[option.id] ?? 0) + 1 })); }}
                        disabled={totalSel >= addon.maxSelect}
                        className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-30">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Alguma observação?</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: sem cebola, ponto bem passado..." rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full px-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-gray-700">−</button>
            <span className="w-6 text-center font-bold text-gray-900">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-orange-500">+</button>
          </div>
          <button onClick={handleAdd} disabled={!canAdd || added}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl flex items-center justify-between px-5 transition-colors">
            <span>{added ? '✓ Adicionado!' : 'Adicionar'}</span>
            <span>{fmt(total)}</span>
          </button>
        </div>
        {!canAdd && <p className="text-xs text-red-500 text-center mt-2">Selecione as opções obrigatórias</p>}
      </div>
    </div>
  );
}
