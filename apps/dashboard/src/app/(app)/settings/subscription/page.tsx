'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../../components/layout/Header';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { formatDate, formatCurrency } from '../../../../lib/utils';
import api from '../../../../lib/api';
import { CheckCircle, Zap, Crown } from 'lucide-react';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/subscription').then(({ data }) => setSubscription(data)),
      api.get('/subscription/plans').then(({ data }) => setPlans(data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    const { data } = await api.post('/payments/stripe/checkout', {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || plans[0]?.stripePriceId,
    });
    if (data.url) window.location.href = data.url;
  };

  const STATUS_COLORS: Record<string, string> = {
    TRIAL: 'warning', ACTIVE: 'success', PAST_DUE: 'error', CANCELLED: 'error', EXPIRED: 'error',
  };

  const STATUS_LABELS: Record<string, string> = {
    TRIAL: 'Trial', ACTIVE: 'Ativo', PAST_DUE: 'Em atraso', CANCELLED: 'Cancelado', EXPIRED: 'Expirado',
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex flex-col h-screen">
      <Header title="Assinatura" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Current subscription */}
          {subscription && (
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Sua Assinatura</h2>
                  <p className="text-gray-400 text-sm">Plano {subscription.plan?.name}</p>
                </div>
                <Badge variant={STATUS_COLORS[subscription.status] as any}>
                  {STATUS_LABELS[subscription.status]}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                {subscription.trialEndsAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trial expira em:</span>
                    <span className="text-white">{formatDate(subscription.trialEndsAt)}</span>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Próxima cobrança:</span>
                    <span className="text-white">{formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-[#FF6B00] font-bold">{formatCurrency(Number(subscription.plan?.price || 297))}/mês</span>
                </div>
              </div>
            </div>
          )}

          {/* Plans */}
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#1a1a2e] border border-[#FF6B00] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={20} className="text-[#FF6B00]" />
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <span className="ml-auto text-3xl font-black text-[#FF6B00]">
                  {formatCurrency(Number(plan.price))}<span className="text-sm text-gray-400 font-normal">/mês</span>
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{plan.trialDays} dias grátis • Cancele quando quiser</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {(plan.features as string[] || []).map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              {(!subscription || subscription.status === 'TRIAL' || subscription.status === 'EXPIRED') && (
                <Button onClick={handleSubscribe} size="lg" className="w-full">
                  <Zap size={18} />
                  Assinar Agora
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
