'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import api from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          style={{ color: s <= rating ? '#f59e0b' : '#374151' }}
          fill={s <= rating ? '#f59e0b' : '#374151'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0 = all

  useEffect(() => {
    api.get('/reviews')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reviews = data?.reviews?.filter((r: any) => filter === 0 || r.rating === filter) ?? [];

  return (
    <div className="flex flex-col h-screen">
      <Header title="Avaliações" subtitle={data ? `Nota média ${data.avg}⭐ de ${data.total} avaliações` : 'Avaliações dos clientes'} />

      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 flex items-center gap-3 col-span-1">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
              </div>
              <div>
                <p className="font-bold text-2xl text-white">{data.avg}</p>
                <p className="text-gray-500 text-xs">Nota média</p>
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 flex items-center gap-3 col-span-1">
              <div className="w-9 h-9 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-[#FF6B00]" />
              </div>
              <div>
                <p className="font-bold text-2xl text-white">{data.total}</p>
                <p className="text-gray-500 text-xs">Total de avaliações</p>
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 flex items-center gap-3 col-span-1">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <div>
                <p className="font-bold text-2xl text-white">
                  {data.total ? Math.round((data.reviews.filter((r: any) => r.rating >= 4).length / data.total) * 100) : 0}%
                </p>
                <p className="text-gray-500 text-xs">Satisfação (4-5★)</p>
              </div>
            </div>

            {/* Distribution */}
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 col-span-1 space-y-1.5">
              {data.dist.map(({ star, count }: { star: number; count: number }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 text-right">{star}</span>
                  <Star size={10} className="text-yellow-400 shrink-0" fill="currentColor" />
                  <div className="flex-1 h-1.5 bg-[#2d2d4f] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: data.total ? `${(count / data.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-4">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter by stars */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(0)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 0 ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a2e] border border-[#2d2d4f] text-gray-400 hover:text-white'}`}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a2e] border border-[#2d2d4f] text-gray-400 hover:text-white'}`}
            >
              <Star size={12} fill="currentColor" /> {s}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && reviews.length === 0 && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl py-16 text-center">
              <Star size={40} className="mx-auto mb-3 text-gray-700" />
              <p className="text-gray-400 font-medium">Nenhuma avaliação {filter ? `com ${filter} estrelas` : 'ainda'}</p>
              <p className="text-gray-600 text-xs mt-1">As avaliações aparecem quando clientes finalizam pedidos</p>
            </div>
          )}

          {reviews.map((review: any) => (
            <div key={review.id} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FF6B00]/20 flex items-center justify-center shrink-0 text-[#FF6B00] font-bold text-sm">
                    {(review.customerName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{review.customerName || 'Cliente anônimo'}</p>
                    <p className="text-gray-500 text-xs">
                      Pedido #{review.order?.orderNumber} • {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <Stars rating={review.rating} size={16} />
              </div>
              {review.comment && (
                <p className="mt-3 text-gray-300 text-sm leading-relaxed border-t border-[#2d2d4f] pt-3">
                  "{review.comment}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
