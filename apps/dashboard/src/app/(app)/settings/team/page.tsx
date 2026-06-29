'use client';
import React, { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { Plus, Trash2, Mail, User } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
  CASHIER: 'Caixa',
  WAITER: 'Garçom',
  KITCHEN: 'Cozinha',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-900/50 text-purple-400',
  MANAGER: 'bg-blue-900/50 text-blue-400',
  CASHIER: 'bg-yellow-900/50 text-yellow-400',
  WAITER: 'bg-green-900/50 text-green-400',
  KITCHEN: 'bg-orange-900/50 text-orange-400',
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'WAITER' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await api.get('/restaurant/users');
      setMembers(res.data || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.name) {
      setError('Preencha email e nome');
      return;
    }
    setInviteLoading(true);
    setError('');
    try {
      await api.post('/restaurant/users', inviteForm);
      setInviteSuccess(`Convite enviado para ${inviteForm.email}`);
      setInviteForm({ email: '', name: '', role: 'WAITER' });
      setShowInvite(false);
      fetchMembers();
      setTimeout(() => setInviteSuccess(''), 5000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao enviar convite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remover este usuário da equipe?')) return;
    try {
      await api.delete(`/restaurant/users/${userId}`);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao remover');
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
          { href: '/settings/payments', label: 'Pagamentos' },
          { href: '/settings/team', label: 'Equipe', active: true },
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe</h1>
          <p className="text-gray-400 text-sm">Gerencie os membros da sua equipe</p>
        </div>
        <Button onClick={() => setShowInvite(true)} size="sm">
          <Plus size={14} /> Convidar
        </Button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="bg-[#1a1a2e] rounded-xl p-5 space-y-3 mb-4">
          <h3 className="font-semibold text-white">Convidar novo membro</h3>
          <input
            value={inviteForm.name}
            onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nome completo"
            className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
          />
          <input
            value={inviteForm.email}
            onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            type="email"
            className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
          />
          <select
            value={inviteForm.role}
            onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
          >
            {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'OWNER').map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowInvite(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={inviteLoading} className="flex-1">
              Enviar convite
            </Button>
          </div>
        </form>
      )}

      {inviteSuccess && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm mb-4">
          {inviteSuccess}
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="bg-[#1a1a2e] rounded-xl p-8 text-center">
              <User size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Nenhum membro na equipe</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="bg-[#1a1a2e] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] font-bold text-sm flex-shrink-0">
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{member.name}</p>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[member.role] || 'bg-gray-700 text-gray-300'}`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                    <Mail size={11} /> {member.email}
                  </p>
                  {member.lastLoginAt && (
                    <p className="text-gray-600 text-xs mt-0.5">
                      Último acesso: {new Date(member.lastLoginAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {member.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
