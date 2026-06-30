'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '../../../../components/layout/Header';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { useAuthStore } from '../../../../store/auth.store';
import api from '../../../../lib/api';

const SETTINGS_NAV = [
  { label: 'Restaurante', href: '/settings/restaurant' },
  { label: 'Horários', href: '/settings/operating-hours' },
  { label: 'Entrega', href: '/settings/delivery' },
  { label: 'Pagamentos', href: '/settings/payments' },
  { label: 'WhatsApp', href: '/settings/whatsapp' },
  { label: 'Impressoras', href: '/settings/printers' },
  { label: 'Equipe', href: '/settings/team' },
  { label: 'Assinatura', href: '/settings/subscription' },
];

export default function RestaurantSettingsPage() {
  const { restaurant, updateRestaurant } = useAuthStore();
  const pathname = usePathname();
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    primaryColor: '#FF6B00',
    minimumOrder: 0,
    deliveryFee: 0,
    estimatedTime: 30,
    pixKey: '',
    pixKeyType: 'phone',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm((f) => ({
        ...f,
        name: restaurant.name || '',
        description: (restaurant as any).description || '',
        phone: (restaurant as any).phone || '',
        email: (restaurant as any).email || '',
        primaryColor: restaurant.primaryColor || '#FF6B00',
      }));
    }
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
    const { data } = await api.get('/restaurant');
    setForm({
      name: data.name || '',
      description: data.description || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      primaryColor: data.primaryColor || '#FF6B00',
      minimumOrder: Number(data.minimumOrder) || 0,
      deliveryFee: Number(data.deliveryFee) || 0,
      estimatedTime: data.estimatedTime || 30,
      pixKey: data.pixKey || '',
      pixKeyType: data.pixKeyType || 'phone',
    });
    } catch (err) {
      console.error('Failed to load restaurant', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/restaurant', form);
      updateRestaurant({ name: data.name, primaryColor: data.primaryColor });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Configurações" />
      <div className="flex-1 flex overflow-hidden">
        {/* Settings Nav */}
        <div className="w-56 border-r border-[#2d2d4f] p-4">
          <nav className="space-y-1">
            {SETTINGS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-[#FF6B00]/10 text-[#FF6B00]'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e1e35]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Informações do Restaurante</h2>
              <p className="text-sm text-gray-400">Configure as informações básicas do seu restaurante</p>
            </div>

            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome do Restaurante" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                <Input label="Telefone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Descrição</label>
                <textarea
                  className="w-full h-20 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 py-2 text-sm resize-none focus:border-[#FF6B00] outline-none"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva seu restaurante..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <Input label="CEP" value={form.zipCode} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))} />
              </div>
              <Input label="Endereço" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
                <Input label="Estado" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              </div>
            </div>

            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white">Configurações de Pedido</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Pedido Mínimo (R$)"
                  type="number"
                  value={form.minimumOrder}
                  onChange={(e) => setForm((f) => ({ ...f, minimumOrder: Number(e.target.value) }))}
                />
                <Input
                  label="Taxa de Entrega (R$)"
                  type="number"
                  value={form.deliveryFee}
                  onChange={(e) => setForm((f) => ({ ...f, deliveryFee: Number(e.target.value) }))}
                />
                <Input
                  label="Tempo Est. (min)"
                  type="number"
                  value={form.estimatedTime}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedTime: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white">Chave Pix</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Tipo</label>
                  <select
                    className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none"
                    value={form.pixKeyType}
                    onChange={(e) => setForm((f) => ({ ...f, pixKeyType: e.target.value }))}
                  >
                    <option value="phone">Telefone</option>
                    <option value="email">E-mail</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="random">Aleatória</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Input label="Chave Pix" value={form.pixKey} onChange={(e) => setForm((f) => ({ ...f, pixKey: e.target.value }))} placeholder="Insira sua chave Pix" />
                </div>
              </div>
            </div>

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
                Configurações salvas com sucesso!
              </div>
            )}

            <Button onClick={handleSave} loading={loading} size="lg">
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
