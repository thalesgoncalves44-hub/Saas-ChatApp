'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, UtensilsCrossed, Zap } from 'lucide-react';
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

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await registerUser(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6B00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ZappAI</h1>
          <p className="text-gray-400 mt-2">7 dias grátis • Sem cartão de crédito</p>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Criar conta</h2>

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
              Criar conta grátis
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
      </div>
    </div>
  );
}
