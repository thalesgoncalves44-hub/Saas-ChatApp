'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Zap } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import api from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6B00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
        </div>

        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">E-mail enviado!</h3>
              <p className="text-gray-400 text-sm">Verifique sua caixa de entrada para redefinir sua senha.</p>
              <Link href="/login">
                <Button className="mt-6 w-full">Voltar para o login</Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-6">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  icon={<Mail size={16} />}
                  required
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Enviar link de recuperação
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-[#FF6B00] hover:underline">
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
