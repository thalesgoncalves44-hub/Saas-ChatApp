'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Clock, MapPin, Star, ChevronDown, Plus, Minus, X } from 'lucide-react';
import { useCartStore } from '../../../lib/cart.store';

interface Props {
  restaurant: any;
  categories: any[];
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function RestaurantMenu({ restaurant, categories }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id || null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { addItem, items, getTotal, getItemCount } = useCartStore();

  const primaryColor = restaurant.primaryColor || '#FF6B00';

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    products: cat.products.filter((p: any) =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.products.length > 0);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem(
      {
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: Number(selectedProduct.promotionalPrice || selectedProduct.price),
        quantity,
        notes: notes || undefined,
      },
      restaurant.id,
      restaurant.slug,
    );
    setSelectedProduct(null);
    setQuantity(1);
    setNotes('');
  };

  const cartCount = getItemCount();

  return (
    <div className="min-h-screen bg-gray-50" style={{ '--primary': primaryColor } as any}>
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto">
          {restaurant.bannerUrl && (
            <img src={restaurant.bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
          )}
          <div className="p-4 flex items-start gap-4">
            {restaurant.logoUrl && (
              <img src={restaurant.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.description && <p className="text-sm text-gray-500 mt-0.5">{restaurant.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{restaurant.estimatedTime}min</span>
                </div>
                {Number(restaurant.deliveryFee) > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>Entrega: {formatCurrency(Number(restaurant.deliveryFee))}</span>
                  </div>
                )}
                <span className={`px-2 py-0.5 rounded-full font-medium ${restaurant.isOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {restaurant.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-24">
        {/* Search */}
        <div className="px-4 py-3 bg-white border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
          </div>
        </div>

        {/* Category pills */}
        {!search && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={activeCategory === cat.id ? { backgroundColor: primaryColor, color: 'white' } : { backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        <div className="p-4 space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} id={`cat-${category.id}`}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">{category.name}</h2>
              <div className="space-y-3">
                {category.products.map((product: any) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setSelectedProduct(product); setQuantity(1); setNotes(''); }}
                  >
                    <div className="flex gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {product.promotionalPrice ? (
                            <>
                              <span className="text-lg font-bold" style={{ color: primaryColor }}>{formatCurrency(Number(product.promotionalPrice))}</span>
                              <span className="text-sm text-gray-400 line-through">{formatCurrency(Number(product.price))}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold" style={{ color: primaryColor }}>{formatCurrency(Number(product.price))}</span>
                          )}
                        </div>
                      </div>
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
          <a href={`/r/${restaurant.slug}/cart`}>
            <button
              className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-between px-6 shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                {cartCount}
              </span>
              <span>Ver sacola</span>
              <span>{formatCurrency(getTotal())}</span>
            </button>
          </a>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 flex items-center justify-between border-b">
              <h2 className="font-bold text-gray-900 text-lg">{selectedProduct.name}</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {selectedProduct.imageUrl && (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-xl" />
              )}
              {selectedProduct.description && (
                <p className="text-gray-600">{selectedProduct.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {formatCurrency(Number(selectedProduct.promotionalPrice || selectedProduct.price))}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between py-3 border-t border-b">
                <span className="font-medium text-gray-700">Quantidade</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Minus size={16} className="text-gray-600" />
                  </button>
                  <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma observação? (ex: sem cebola)"
                  className="w-full h-20 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                  style={{ '--tw-ring-color': primaryColor } as any}
                />
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 rounded-2xl text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Adicionar • {formatCurrency(Number(selectedProduct.promotionalPrice || selectedProduct.price) * quantity)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
