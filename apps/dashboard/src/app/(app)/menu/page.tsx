'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import { formatCurrency } from '../../../lib/utils';
import api from '../../../lib/api';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products'),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      if (catRes.data.length && !selectedCategory) {
        setSelectedCategory(catRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveCategory = async () => {
    if (editCategory) {
      await api.put(`/categories/${editCategory.id}`, categoryForm);
    } else {
      await api.post('/categories', categoryForm);
    }
    setShowCategoryModal(false);
    setEditCategory(null);
    setCategoryForm({ name: '', description: '' });
    loadMenu();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria e todos os seus produtos?')) return;
    await api.delete(`/categories/${id}`);
    loadMenu();
  };

  const handleToggleProduct = async (productId: string) => {
    await api.patch(`/products/${productId}/toggle-availability`);
    loadMenu();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Excluir este produto?')) return;
    await api.delete(`/products/${productId}`);
    loadMenu();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="Cardápio" subtitle="Gerencie categorias e produtos" />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Categories */}
        <div className="w-64 border-r border-[#2d2d4f] flex flex-col">
          <div className="p-4 border-b border-[#2d2d4f]">
            <Button
              onClick={() => { setEditCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryModal(true); }}
              className="w-full"
              size="sm"
            >
              <Plus size={14} />
              Nova Categoria
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all',
                  selectedCategory === cat.id
                    ? 'bg-[#FF6B00]/10 text-[#FF6B00]'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e1e35]',
                )}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                <span className="text-xs opacity-60">{cat._count?.products || 0}</span>
                <div className="hidden group-hover:flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryModal(true); }}
                    className="p-1 hover:text-[#FF6B00]"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    className="p-1 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2d2d4f] flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={14} />}
              />
            </div>
            <Link href="/menu/products/new">
              <Button size="sm">
                <Plus size={14} />
                Novo Produto
              </Button>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    'bg-[#1a1a2e] border rounded-xl overflow-hidden card-hover',
                    !product.isAvailable ? 'border-gray-700 opacity-60' : 'border-[#2d2d4f]',
                  )}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-[#2d2d4f] flex items-center justify-center text-gray-600">
                      <span className="text-3xl">🍽️</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-white text-sm">{product.name}</h3>
                      {product.isFeatured && (
                        <span className="text-[10px] bg-[#FF6B00]/20 text-[#FF6B00] px-1.5 py-0.5 rounded">
                          Destaque
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      {product.promotionalPrice ? (
                        <>
                          <span className="text-sm text-[#FF6B00] font-bold">{formatCurrency(Number(product.promotionalPrice))}</span>
                          <span className="text-xs text-gray-600 line-through">{formatCurrency(Number(product.price))}</span>
                        </>
                      ) : (
                        <span className="text-sm text-[#FF6B00] font-bold">{formatCurrency(Number(product.price))}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/menu/products/${product.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit size={12} />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleProduct(product.id)}
                        className={product.isAvailable ? 'text-green-400' : 'text-gray-600'}
                      >
                        {product.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500">
                  <p className="text-4xl mb-4">🍽️</p>
                  <p className="text-lg font-medium">Nenhum produto encontrado</p>
                  <p className="text-sm mt-1">Adicione produtos ao seu cardápio</p>
                  <Link href="/menu/products/new">
                    <Button className="mt-4">
                      <Plus size={14} />
                      Adicionar produto
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditCategory(null); }}
        title={editCategory ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Hambúrgueres"
            required
          />
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Descrição</label>
            <textarea
              className="w-full h-20 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 py-2 text-sm resize-none focus:border-[#FF6B00] outline-none"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição opcional..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveCategory} className="flex-1">
              {editCategory ? 'Salvar' : 'Criar Categoria'}
            </Button>
            <Button variant="outline" onClick={() => { setShowCategoryModal(false); setEditCategory(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
