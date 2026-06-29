'use client';
import React, { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { Clock } from 'lucide-react';

const DAYS = [
  { key: 0, label: 'Domingo' },
  { key: 1, label: 'Segunda-feira' },
  { key: 2, label: 'Terça-feira' },
  { key: 3, label: 'Quarta-feira' },
  { key: 4, label: 'Quinta-feira' },
  { key: 5, label: 'Sexta-feira' },
  { key: 6, label: 'Sábado' },
];

interface DayHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function OperatingHoursPage() {
  const [hours, setHours] = useState<DayHours[]>(
    DAYS.map((d) => ({ dayOfWeek: d.key, isOpen: d.key >= 1 && d.key <= 5, openTime: '08:00', closeTime: '22:00' })),
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/restaurant/operating-hours')
      .then((r) => {
        if (r.data && r.data.length > 0) {
          const fetched: DayHours[] = r.data;
          setHours((prev) =>
            prev.map((day) => {
              const found = fetched.find((f) => f.dayOfWeek === day.dayOfWeek);
              return found ? { ...day, ...found } : day;
            }),
          );
        }
      })
      .catch(() => {});
  }, []);

  const toggleDay = (dayOfWeek: number) => {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, isOpen: !h.isOpen } : h)));
  };

  const updateTime = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    setError('');
    try {
      await api.put('/restaurant/operating-hours', { hours });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      {/* Settings Nav */}
      <div className="flex gap-2 mb-6 text-sm overflow-x-auto pb-1">
        {[
          { href: '/settings/restaurant', label: 'Restaurante' },
          { href: '/settings/operating-hours', label: 'Horários', active: true },
          { href: '/settings/delivery', label: 'Entrega' },
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

      <h1 className="text-2xl font-bold text-white mb-1">Horários de Funcionamento</h1>
      <p className="text-gray-400 text-sm mb-6">Configure os dias e horários em que seu restaurante funciona</p>

      <div className="space-y-3">
        {DAYS.map((day) => {
          const h = hours.find((x) => x.dayOfWeek === day.key)!;
          return (
            <div key={day.key} className="bg-[#1a1a2e] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => toggleDay(day.key)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${h.isOpen ? 'bg-[#FF6B00]' : 'bg-[#2d2d4f]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${h.isOpen ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className={`font-medium w-36 ${h.isOpen ? 'text-white' : 'text-gray-500'}`}>{day.label}</span>
                {h.isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Clock size={14} className="text-gray-400" />
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => updateTime(day.key, 'openTime', e.target.value)}
                      className="bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#FF6B00] w-28"
                    />
                    <span className="text-gray-500">até</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => updateTime(day.key, 'closeTime', e.target.value)}
                      className="bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-[#FF6B00] w-28"
                    />
                  </div>
                ) : (
                  <span className="text-gray-600 text-sm">Fechado</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
          Horários salvos com sucesso!
        </div>
      )}

      <Button onClick={handleSave} loading={loading} size="lg" className="mt-6 w-full">
        Salvar horários
      </Button>
    </div>
  );
}
