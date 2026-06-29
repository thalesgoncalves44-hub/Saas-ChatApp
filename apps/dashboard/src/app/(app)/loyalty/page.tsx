'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoyaltyProgram {
  id?: string;
  type: 'points' | 'cashback' | 'stamps';
  pointsPerReal: number;
  cashbackPercent: number;
  minRedeem: number;
  isActive: boolean;
}

const DEFAULT: LoyaltyProgram = {
  type: 'cashback',
  pointsPerReal: 1,
  cashbackPercent: 5,
  minRedeem: 100,
  isActive: false,
};

export default function LoyaltyPage() {
  const [program, setProgram] = useState<LoyaltyProgram>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/loyalty').then(r => setProgram(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/loyalty', program);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-gray-400">Carregando...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Programa de Fidelidade</h1>
        <p className="text-gray-400 mt-1">Retenha clientes com recompensas automáticas</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status do programa</CardTitle>
            <Switch checked={program.isActive} onCheckedChange={v => setProgram(p => ({ ...p, isActive: v }))} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de fidelidade</label>
            <div className="grid grid-cols-3 gap-3">
              {(['cashback', 'points', 'stamps'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setProgram(p => ({ ...p, type: t }))}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    program.type === t
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {t === 'cashback' ? '💰' : t === 'points' ? '⭐' : '🎫'}
                  </div>
                  <div className="text-sm font-semibold capitalize">
                    {t === 'cashback' ? 'Cashback' : t === 'points' ? 'Pontos' : 'Carimbos'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {program.type === 'cashback' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                % de cashback por compra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1} max={20} step={0.5}
                  value={program.cashbackPercent}
                  onChange={e => setProgram(p => ({ ...p, cashbackPercent: +e.target.value }))}
                  className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-gray-400">%</span>
                <span className="text-gray-500 text-sm">— Ex: cliente gasta R$100 → ganha R${program.cashbackPercent.toFixed(2)} de cashback</span>
              </div>
            </div>
          )}

          {program.type === 'points' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pontos por R$1 gasto
              </label>
              <input
                type="number" min={1} max={100}
                value={program.pointsPerReal}
                onChange={e => setProgram(p => ({ ...p, pointsPerReal: +e.target.value }))}
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {program.type !== 'stamps' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mínimo para resgatar
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={10}
                  value={program.minRedeem}
                  onChange={e => setProgram(p => ({ ...p, minRedeem: +e.target.value }))}
                  className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-gray-400">{program.type === 'cashback' ? 'pontos' : 'pontos'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-400 border border-gray-700">
        <p className="font-semibold text-gray-300 mb-2">📊 Como funciona</p>
        {program.type === 'cashback'
          ? `Cada R$1 que o cliente gasta dá ${program.cashbackPercent}¢ de cashback. Ele pode usar o saldo em compras futuras.`
          : program.type === 'points'
          ? `Cada R$1 gasto vale ${program.pointsPerReal} ponto(s). Com ${program.minRedeem} pontos o cliente pode resgatar um desconto.`
          : 'Após um número configurado de pedidos, o cliente ganha 1 item gratuito (ex: 10 cafés = 1 grátis).'}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar configurações'}
      </button>
    </div>
  );
}
