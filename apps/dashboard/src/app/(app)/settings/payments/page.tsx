'use client';
import React, { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

interface PaymentMethod {
  key: string;
  label: string;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { key: 'PIX', label: 'PIX', description: 'Pagamento instantâneo via QR Code' },
  { key: 'CREDIT_CARD', label: 'Cartão de Crédito', description: 'Cartão de crédito na entrega ou maquininha' },
  { key: 'DEBIT_CARD', label: 'Cartão de Débito', description: 'Cartão de débito na entrega ou maquininha' },
  { key: 'CASH', label: 'Dinheiro', description: 'Pagamento em espécie' },
  { key: 'MEAL_VOUCHER', label: 'Vale Refeição', description: 'Sodexo, Alelo, VR, etc.' },
];

export default function PaymentSettingsPage() {
  const [enabledMethods, setEnabledMethods] = useState<string[]>(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD']);
  const [asaasKey, setAsaasKey] = useState('');
  const [asaasEnv, setAsaasEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/restaurant')
      .then((r) => {
        if (r.data.acceptedPaymentMethods) {
          setEnabledMethods(r.data.acceptedPaymentMethods);
        }
      })
      .catch(() => {});
  }, []);

  const toggleMethod = (key: string) => {
    setEnabledMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    setError('');
    try {
      await api.put('/restaurant', { acceptedPaymentMethods: enabledMethods });
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
          { href: '/settings/operating-hours', label: 'Horários' },
          { href: '/settings/delivery', label: 'Entrega' },
          { href: '/settings/payments', label: 'Pagamentos', active: true },
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

      <h1 className="text-2xl font-bold text-white mb-1">Métodos de Pagamento</h1>
      <p className="text-gray-400 text-sm mb-6">Configure quais formas de pagamento seu restaurante aceita</p>

      <div className="space-y-4">
        {/* Payment Methods Toggle */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-white mb-1">Formas de pagamento aceitas</h3>
          {PAYMENT_METHODS.map((method) => {
            const enabled = enabledMethods.includes(method.key);
            return (
              <div
                key={method.key}
                onClick={() => toggleMethod(method.key)}
                className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-[#0f0f1a] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${enabled ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'bg-[#2d2d4f] text-gray-500'}`}>
                    {method.key.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{method.label}</p>
                    <p className="text-gray-500 text-xs">{method.description}</p>
                  </div>
                </div>
                {enabled ? (
                  <CheckCircle size={20} className="text-[#FF6B00]" />
                ) : (
                  <XCircle size={20} className="text-gray-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Asaas Integration */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-white">Integração Asaas (PIX automático)</h3>
            <p className="text-gray-500 text-xs mt-0.5">Opcional - para gerar QR Codes PIX automaticamente</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">API Key do Asaas</label>
            <input
              value={asaasKey}
              onChange={(e) => setAsaasKey(e.target.value)}
              type="password"
              placeholder="$aact_..."
              className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00] font-mono"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Ambiente</label>
            <div className="flex gap-2">
              {(['sandbox', 'production'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setAsaasEnv(env)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    asaasEnv === env ? 'bg-[#FF6B00] text-white' : 'bg-[#0f0f1a] text-gray-400 border border-[#2d2d4f]'
                  }`}
                >
                  {env === 'sandbox' ? 'Sandbox (teste)' : 'Produção'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-gray-600 text-xs">
            Configure a variável de ambiente ASAAS_API_KEY no servidor para usar esta integração.
          </p>
        </div>

        {/* Stripe Integration */}
        <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-white">Integração Stripe</h3>
            <p className="text-gray-500 text-xs mt-0.5">Para pagamentos online com cartão de crédito</p>
          </div>
          <p className="text-gray-600 text-xs">
            Configure STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY no servidor.
            Os pagamentos via Stripe são processados automaticamente.
          </p>
          <div className="flex items-center gap-2 text-yellow-400 text-xs">
            <span>⚠</span>
            <span>A integração Stripe é configurada pelo administrador do sistema</span>
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
