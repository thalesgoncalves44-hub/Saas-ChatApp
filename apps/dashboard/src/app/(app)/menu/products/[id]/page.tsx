'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Button } from '../../../../../components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    promotionalPrice: '',
    categoryId: '',
    imageUrl: '',
    sku: '',
    trackStock: false,
    stockQuantity: '',
    stockMinimum: '',
    isAvailable: true,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get('/categories'),
    ])
      .then(([prodRes, catRes]) => {
        const p = prodRes.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price?.toString() || '',
          promotionalPrice: p.promotionalPrice?.toString() || '',
          categoryId: p.categoryId || '',
          imageUrl: p.imageUrl || '',
          sku: p.sku || '',
          trackStock: p.trackStock || false,
          stockQuantity: p.stockQuantity?.toString() || '',
          stockMinimum: p.stockMinimum?.toString() || '',
          isAvailable: p.isAvailable !== false,
        });
        setCategories(catRes.data);
      })
      .catch(() => setError('Produto não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');
    try {
      await api.put(`/products/${id}`, {
        ...form,
        price: parseFloat(form.price),
        promotionalPrice: form.promotionalPrice ? parseFloat(form.promotionalPrice) : null,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        stockMinimum: form.stockMinimum ? parseInt(form.stockMinimum) : null,
      });
      router.push('/menu');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${id}`);
      router.push('/menu');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao excluir');
    } finally {
      setDeleteLoading(false);
    }
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[#1e1e35] text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Produto</h1>
            <p className="text-gray-400 text-sm">{form.name}</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" loading={deleteLoading} onClick={handleDelete}>
          <Trash2 size={14} />
          Excluir
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Informações básicas</h3>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Nome do produto *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Categoria *</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-400">Disponível no cardápio</span>
            <div
              onClick={() => set('isAvailable', !form.isAvailable)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.isAvailable ? 'bg-[#FF6B00]' : 'bg-[#2d2d4f]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Preço</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Preço normal *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Preço promocional</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  value={form.promotionalPrice}
                  onChange={(e) => set('promotionalPrice', e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-white">Imagem</h3>
          <input
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
          />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-[#2d2d4f]" />
          )}
        </div>

        {/* Stock */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Controle de estoque</h3>
            <div
              onClick={() => set('trackStock', !form.trackStock)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.trackStock ? 'bg-[#FF6B00]' : 'bg-[#2d2d4f]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.trackStock ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </div>
          {form.trackStock && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Estoque atual</label>
                <input
                  value={form.stockQuantity}
                  onChange={(e) => set('stockQuantity', e.target.value)}
                  type="number"
                  min="0"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Estoque mínimo</label>
                <input
                  value={form.stockMinimum}
                  onChange={(e) => set('stockMinimum', e.target.value)}
                  type="number"
                  min="0"
                  className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={saveLoading} className="flex-1">
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
