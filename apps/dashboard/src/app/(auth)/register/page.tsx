'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, UtensilsCrossed, Zap, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../../store/auth.store';

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  restaurantName: z.string().min(2, 'Nome do restaurante muito curto'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    price: 147,
    originalPrice: 247,
    description: 'Ideal para começar',
    highlight: false,
    features: [
      'Cardápio digital com QR Code',
      'Gestão de pedidos Kanban',
      'Até 150 pedidos/mês',
      'Relatórios básicos',
      '1 usuário',
    ],
    missing: ['Bot WhatsApp', 'CRM de clientes', 'Programa de fidelidade'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: 297,
    originalPrice: 497,
    description: 'O mais escolhido',
    highlight: true,
    features: [
      'Cardápio digital com QR Code',
      'Gestão de pedidos Kanban',
      'Pedidos ilimitados',
      'Bot WhatsApp automático',
      'CRM de clientes',
      'Programa de fidelidade',
      'Relatórios financeiros',
      'Controle de estoque',
      'Até 5 usuários',
    ],
    missing: [],
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: 397,
    originalPrice: 697,
    description: 'Para quem quer tudo',
    highlight: false,
    features: [
      'Tudo do plano Pro',
      'Pedidos ilimitados',
      'Suporte prioritário via WhatsApp',
      'Multi-unidade',
      'Relatórios avançados',
      'Gerente de conta dedicado',
      'Até 10 usuários',
    ],
    missing: [],
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [step, setStep] = useState<'plan' | 'form'>('plan');
  const [selectedPlan, setSelectedPlan] = useState('pro');

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && PLANS.find(p => p.slug === plan)) {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await registerUser({ ...data, planSlug: selectedPlan } as any);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className={`w-full ${step === 'plan' ? 'max-w-4xl' : 'max-w-md'}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6B00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ZappAI</h1>
          <p className="text-gray-400 mt-2">7 dias grátis • Sem cartão de crédito</p>
        </div>

        {step === 'plan' ? (
          <div>
            <h2 className="text-xl font-semibold text-white text-center mb-2">Escolha seu plano</h2>
            <p className="text-gray-400 text-center text-sm mb-8">Todos com 7 dias grátis. Cancele quando quiser.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.slug}
                  onClick={() => setSelectedPlan(plan.slug)}
                  className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all ${
                    selectedPlan === plan.slug
                      ? 'border-[#FF6B00] bg-[#FF6B00]/5'
                      : plan.highlight
                      ? 'border-[#FF6B00]/40 bg-[#1a1a2e]'
                      : 'border-[#2d2d4f] bg-[#1a1a2e] hover:border-[#FF6B00]/30'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      MAIS POPULAR
                    </div>
                  )}
                  {selectedPlan === plan.slug && (
                    <div className="absolute top-4 right-4 w-5 h-5 bg-[#FF6B00] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  <p className="text-gray-400 text-xs mb-1">{plan.description}</p>
                  <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-gray-500 line-through text-sm">R$ {plan.originalPrice}</span>
                    <span className="text-2xl font-extrabold text-[#FF6B00]">R$ {plan.price}</span>
                    <span className="text-gray-400 text-sm mb-0.5">/mês</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                        <Check size={12} className="text-[#FF6B00] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600 line-through">
                        <span className="w-3 shrink-0">✗</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setStep('form')} size="lg" className="px-10">
                Continuar com o plano {PLANS.find(p => p.slug === selectedPlan)?.name}
                <ArrowRight size={18} />
              </Button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-4">
              Já tem conta?{' '}
              <Link href="/login" className="text-[#FF6B00] hover:underline">Entrar</Link>
            </p>
          </div>
        ) : (
          <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-2xl p-8">
            <button
              onClick={() => setStep('plan')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar e trocar plano
            </button>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Criar conta</h2>
              <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-xs font-bold px-3 py-1 rounded-full">
                Plano {PLANS.find(p => p.slug === selectedPlan)?.name} • R$ {PLANS.find(p => p.slug === selectedPlan)?.price}/mês
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Seu nome"
                placeholder="João Silva"
                icon={<User size={16} />}
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Nome do restaurante"
                placeholder="Minha Pizzaria"
                icon={<UtensilsCrossed size={16} />}
                error={errors.restaurantName?.message}
                {...register('restaurantName')}
              />
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                icon={<Mail size={16} />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                {...register('password')}
              />

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                Criar conta grátis — 7 dias grátis
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Já tem conta?{' '}
              <Link href="/login" className="text-[#FF6B00] hover:underline font-medium">
                Entrar
              </Link>
            </div>
            <p className="text-xs text-gray-600 text-center mt-4">
              Ao criar sua conta, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
