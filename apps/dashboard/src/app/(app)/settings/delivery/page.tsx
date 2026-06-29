'use client';
import React, { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';

interface DeliveryArea {
  id?: string;
  neighborhood: string;
  city: string;
  fee: string;
  minTime: string;
  maxTime: string;
}

export default function DeliverySettingsPage() {
  const [restaurantForm, setRestaurantForm] = useState({
    deliveryFee: '',
    minimumOrder: '',
    estimatedTime: '',
    deliveryRadius: '',
  });
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/restaurant'), api.get('/restaurant/delivery-areas')])
      .then(([rRes, aRes]) => {
        const r = rRes.data;
        setRestaurantForm({
          deliveryFee: r.deliveryFee?.toString() || '',
          minimumOrder: r.minimumOrder?.toString() || '',
          estimatedTime: r.estimatedTime?.toString() || '',
          deliveryRadius: r.deliveryRadius?.toString() || '',
        });
        setAreas(
          (aRes.data || []).map((a: any) => ({
            id: a.id,
            neighborhood: a.neighborhood || '',
            city: a.city || '',
            fee: a.fee?.toString() || '',
            minTime: a.minTime?.toString() || '',
            maxTime: a.maxTime?.toString() || '',
          })),
        );
      })
      .catch(() => {});
  }, []);

  const addArea = () => {
    setAreas((prev) => [...prev, { neighborhood: '', city: '', fee: '', minTime: '30', maxTime: '45' }]);
  };

  const removeArea = (idx: number) => {
    setAreas((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateArea = (idx: number, k: keyof DeliveryArea, v: string) => {
    setAreas((prev) => prev.map((a, i) => (i === idx ? { ...a, [k]: v } : a)));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    setError('');
    try {
      await api.put('/restaurant', {
        deliveryFee: restaurantForm.deliveryFee ? parseFloat(restaurantForm.deliveryFee) : 0,
        minimumOrder: restaurantForm.minimumOrder ? parseFloat(restaurantForm.minimumOrder) : 0,
        estimatedTime: restaurantForm.estimatedTime ? parseInt(restaurantForm.estimatedTime) : 30,
        deliveryRadius: restaurantForm.deliveryRadius ? parseFloat(restaurantForm.deliveryRadius) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setRestaurantForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 max-w-2xl">
      {/* Settings Nav */}
      <div className="flex gap-2 mb-6 text-sm overflow-x-auto pb-1">
        {[
          { href: '/settings/restaurant', label: 'Restaurante' },
          { href: '/settings/operating-hours', label: 'Horários' },
          { href: '/settings/delivery', label: 'Entrega', active: true },
          { href: '/settings/payments', label: 'Pagamentos' },
          { href: '/settings/team', label: 'Equipe' },
          { href: '/settings/whatsapp', label: 'WhatsApp' },
          { href: '/settings/printers', label: 'Impressoras' },
          { href: '/settings/subscription', label: 'Assinatura' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              item.active ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a2e] text-gray-400 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">Configurações de Entrega</h1>
      <p className="text-gray-400 text-sm mb-6">Configure taxas, tempo estimado e áreas de entrega</p>

      <div className="space-y-4">
        {/* Basic delivery config */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Configurações gerais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Taxa de entrega padrão (R$)</label>
              <input
                value={restaurantForm.deliveryFee}
                onChange={(e) => set('deliveryFee', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Pedido mínimo (R$)</label>
              <input
                value={restaurantForm.minimumOrder}
                onChange={(e) => set('minimumOrder', e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Tempo estimado (min)</label>
              <input
                value={restaurantForm.estimatedTime}
                onChange={(e) => set('estimatedTime', e.target.value)}
                type="number"
                min="1"
                placeholder="30"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Raio de entrega (km)</label>
              <input
                value={restaurantForm.deliveryRadius}
                onChange={(e) => set('deliveryRadius', e.target.value)}
                type="number"
                step="0.1"
                min="0"
                placeholder="10"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Delivery areas */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Áreas de entrega</h3>
            <Button size="sm" variant="secondary" onClick={addArea}>
              <Plus size={14} /> Adicionar bairro
            </Button>
          </div>

          {areas.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhuma área cadastrada. Adicione bairros ou use o raio de entrega acima.</p>
          )}

          <div className="space-y-3">
            {areas.map((area, idx) => (
              <div key={idx} className="bg-[#0f0f1a] rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-gray-500">Área {idx + 1}</span>
                  <button onClick={() => removeArea(idx)} className="text-gray-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={area.neighborhood}
                    onChange={(e) => updateArea(idx, 'neighborhood', e.target.value)}
                    placeholder="Bairro"
                    className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF6B00]"
                  />
                  <input
                    value={area.city}
                    onChange={(e) => updateArea(idx, 'city', e.target.value)}
                    placeholder="Cidade"
                    className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF6B00]"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R$</span>
                    <input
                      value={area.fee}
                      onChange={(e) => updateArea(idx, 'fee', e.target.value)}
                      placeholder="Taxa"
                      type="number"
                      step="0.01"
                      className="w-full bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg pl-7 pr-3 py-2 text-white text-sm outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      value={area.minTime}
                      onChange={(e) => updateArea(idx, 'minTime', e.target.value)}
                      placeholder="Min"
                      type="number"
                      className="w-full bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF6B00]"
                    />
                    <span className="text-gray-500 text-xs">-</span>
                    <input
                      value={area.maxTime}
                      onChange={(e) => updateArea(idx, 'maxTime', e.target.value)}
                      placeholder="Max"
                      type="number"
                      className="w-full bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF6B00]"
                    />
                    <span className="text-gray-500 text-xs whitespace-nowrap">min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
            Configurações salvas com sucesso!
          </div>
        )}

        <Button onClick={handleSave} loading={loading} size="lg" className="w-full">
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
