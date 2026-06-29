'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Zap } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../../store/auth.store';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'E-mail ou senha inválidos');
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
          <p className="text-gray-400 mt-2">Gestão inteligente para seu restaurante</p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar na plataforma</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-[#FF6B00] hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Não tem conta?{' '}
            <Link href="/register" className="text-[#FF6B00] hover:underline font-medium">
              Criar conta grátis
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          7 dias grátis • Cancele quando quiser • R$297/mês
        </p>
      </div>
    </div>
  );
}
