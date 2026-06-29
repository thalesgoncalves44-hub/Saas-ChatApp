'use client';
import React, { useState } from 'react';
import { useCartStore } from '../../../../lib/cart.store';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <ShoppingBag size={64} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Sua sacola está vazia</h2>
        <p className="text-gray-500 text-sm">Adicione itens do cardápio para continuar</p>
        <Link
          href={`/r/${slug}`}
          className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-2xl font-semibold"
        >
          Ver cardápio
        </Link>
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
          <h1 className="text-lg font-bold text-gray-900">Minha sacola</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-32">
        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <div key={item.productId} className={`p-4 flex gap-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                {item.notes && <p className="text-xs text-gray-400 mt-0.5">Obs: {item.notes}</p>}
                <p className="text-orange-500 font-bold mt-1">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Minus size={14} className="text-gray-600" />
                  </button>
                  <span className="font-bold text-gray-900 w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center"
                  >
                    <Plus size={14} className="text-white" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-gray-900">Resumo do pedido</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} itens)</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-orange-500 text-lg">{formatCurrency(getTotal())}</span>
          </div>
        </div>

        {/* Clear cart */}
        <button
          onClick={() => { clearCart(); router.push(`/r/${slug}`); }}
          className="w-full text-sm text-red-400 hover:text-red-600 transition-colors py-2"
        >
          Limpar sacola
        </button>
      </div>

      {/* Checkout button */}
      <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
        <Link href={`/r/${slug}/checkout`}>
          <button className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-lg flex items-center justify-between px-6 shadow-lg">
            <span>Ir para pagamento</span>
            <span>{formatCurrency(getTotal())}</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
