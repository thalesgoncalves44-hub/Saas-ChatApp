'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => { setStatus('success'); setTimeout(() => router.push('/dashboard'), 3000); })
      .catch(() => setStatus('error'));
  }, [token, router]);

  return (
    <>
      {status === 'loading' && (
        <>
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Verificando seu e-mail...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-white mb-2">E-mail verificado!</h2>
          <p className="text-gray-400 text-sm">Redirecionando para o painel em 3 segundos...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-red-400 text-5xl mb-4">✗</div>
          <h2 className="text-xl font-bold text-white mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-400 text-sm mb-6">Faça login e solicite um novo e-mail de verificação.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
          >
            Ir para o login
          </button>
        </>
      )}
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 text-center">
        <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
