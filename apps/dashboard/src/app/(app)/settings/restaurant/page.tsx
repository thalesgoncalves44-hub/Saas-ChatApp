'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, Check, ChefHat, Clock, DollarSign, ExternalLink,
  Instagram, Mail, MapPin, Package, Phone, Save, ShoppingBag,
  Star, Store, ToggleLeft, ToggleRight, Truck, Users, Utensils,
  X, Palette, Globe, Pencil,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { useAuthStore } from '../../../../store/auth.store';
import api from '../../../../lib/api';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: Store },
  { id: 'address', label: 'Endereço', icon: MapPin },
  { id: 'services', label: 'Serviços', icon: ShoppingBag },
  { id: 'branding', label: 'Aparência', icon: Palette },
  { id: 'payment', label: 'Pagamento', icon: DollarSign },
];

const PIX_TYPES = [
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'random', label: 'Aleatória' },
];

type Form = {
  name: string; description: string; phone: string; email: string;
  address: string; city: string; state: string; zipCode: string;
  primaryColor: string; secondaryColor: string;
  acceptsDelivery: boolean; acceptsTakeaway: boolean; acceptsDineIn: boolean;
  minimumOrder: number; deliveryFee: number; estimatedTime: number;
  pixKey: string; pixKeyType: string;
  logoUrl: string; bannerUrl: string;
  instagram: string; whatsapp: string;
};

export default function RestaurantProfilePage() {
  const { restaurant, updateRestaurant } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0 });
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>({
    name: '', description: '', phone: '', email: '',
    address: '', city: '', state: '', zipCode: '',
    primaryColor: '#FF6B00', secondaryColor: '#1a1a2e',
    acceptsDelivery: true, acceptsTakeaway: true, acceptsDineIn: true,
    minimumOrder: 0, deliveryFee: 0, estimatedTime: 30,
    pixKey: '', pixKeyType: 'phone',
    logoUrl: '', bannerUrl: '',
    instagram: '', whatsapp: '',
  });

  const set = (key: keyof Form, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => { loadRestaurant(); }, []);

  const loadRestaurant = async () => {
    try {
      const { data } = await api.get('/restaurant');
      setIsOpen(data.isOpen ?? false);
      setStats({
        products: data._count?.products ?? 0,
        orders: data._count?.orders ?? 0,
        customers: data._count?.customers ?? 0,
      });
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
        secondaryColor: data.secondaryColor || '#1a1a2e',
        acceptsDelivery: data.acceptsDelivery ?? true,
        acceptsTakeaway: data.acceptsTakeaway ?? true,
        acceptsDineIn: data.acceptsDineIn ?? true,
        minimumOrder: Number(data.minimumOrder) || 0,
        deliveryFee: Number(data.deliveryFee) || 0,
        estimatedTime: data.estimatedTime || 30,
        pixKey: data.pixKey || '',
        pixKeyType: data.pixKeyType || 'phone',
        logoUrl: data.logoUrl || '',
        bannerUrl: data.bannerUrl || '',
        instagram: data.instagram || '',
        whatsapp: data.whatsapp || '',
      });
    } catch (err) {
      console.error('Failed to load restaurant', err);
    }
  };

  const handleImageUpload = (field: 'logoUrl' | 'bannerUrl', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => set(field, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleToggleOpen = async () => {
    try {
      const { data } = await api.patch('/restaurant/toggle-open');
      setIsOpen(data.isOpen);
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/restaurant', form);
      updateRestaurant({ name: data.name, primaryColor: data.primaryColor });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const slug = restaurant?.slug || '';

  return (
    <div className="flex-1 overflow-auto">

      {/* ── Banner + Logo hero ── */}
      <div className="relative">
        {/* Banner */}
        <div
          className="relative h-48 bg-gradient-to-br from-[#1a1a2e] via-[#0d0d1a] to-[#FF6B00]/20 overflow-hidden cursor-pointer group"
          onClick={() => bannerRef.current?.click()}
        >
          {form.bannerUrl ? (
            <img src={form.bannerUrl} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={28} className="text-white mx-auto mb-1" />
                <p className="text-white text-sm font-medium">Clique para adicionar foto de capa</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Camera size={12} />
              Trocar capa
            </div>
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload('bannerUrl', e.target.files[0])} />
        </div>

        {/* Logo + info bar */}
        <div className="absolute -bottom-12 left-6 flex items-end gap-4">
          <div
            className="relative w-24 h-24 rounded-2xl border-4 border-[#0f0f1a] bg-[#1a1a2e] flex items-center justify-center cursor-pointer group overflow-hidden shadow-2xl"
            onClick={() => logoRef.current?.click()}
          >
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={32} className="text-[#FF6B00]" />
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              <Camera size={18} className="text-white" />
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageUpload('logoUrl', e.target.files[0])} />
          </div>
        </div>
      </div>

      {/* ── Name + actions bar ── */}
      <div className="pt-16 px-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{form.name || 'Seu Restaurante'}</h1>
          {slug && (
            <a
              href={`${process.env.NEXT_PUBLIC_CARDAPIO_URL || ''}/r/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#FF6B00] mt-0.5 transition-colors"
            >
              <Globe size={10} />
              Ver cardápio público
              <ExternalLink size={10} />
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Open / Closed toggle */}
          <button
            onClick={handleToggleOpen}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              isOpen
                ? 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25'
                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isOpen ? 'Aberto' : 'Fechado'}
            {isOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>

          <Button onClick={handleSave} loading={loading} size="sm" className="gap-1.5">
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: 'Produtos', value: stats.products, color: 'text-blue-400' },
            { icon: ShoppingBag, label: 'Pedidos', value: stats.orders, color: 'text-[#FF6B00]' },
            { icon: Users, label: 'Clientes', value: stats.customers, color: 'text-purple-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-4 flex items-center gap-3">
              <Icon size={20} className={color} />
              <div>
                <p className="text-white font-bold text-lg leading-none">{value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs + content ── */}
      <div className="px-6 pb-10">
        {/* Tab nav */}
        <div className="flex gap-1 bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? 'bg-[#FF6B00] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB: Perfil ── */}
        {tab === 'profile' && (
          <div className="space-y-5 max-w-2xl">
            <Card title="Informações principais">
              <Input
                label="Nome do restaurante"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                icon={<Store size={15} />}
              />
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Uma frase que descreve seu restaurante para os clientes..."
                  className="w-full rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 py-2.5 text-sm resize-none focus:border-[#FF6B00] outline-none placeholder-gray-600"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
                <p className="text-xs text-gray-600 mt-1">{form.description.length}/200 caracteres</p>
              </div>
            </Card>

            <Card title="Contato">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Telefone" value={form.phone} onChange={(e) => set('phone', e.target.value)} icon={<Phone size={15} />} placeholder="(11) 99999-9999" />
                <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} icon={<Mail size={15} />} placeholder="contato@restaurante.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Instagram" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} icon={<Instagram size={15} />} placeholder="@seurestaurante" />
                <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} icon={<Phone size={15} />} placeholder="(11) 99999-9999" />
              </div>
            </Card>

            <Card title="Fotos">
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadBox
                  label="Logo / Ícone"
                  sublabel="Aparece no cardápio e notificações"
                  value={form.logoUrl}
                  square
                  onChange={(url) => set('logoUrl', url)}
                  inputRef={logoRef}
                />
                <ImageUploadBox
                  label="Foto de capa"
                  sublabel="Banner principal do seu perfil"
                  value={form.bannerUrl}
                  onChange={(url) => set('bannerUrl', url)}
                  inputRef={bannerRef}
                />
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Endereço ── */}
        {tab === 'address' && (
          <div className="space-y-5 max-w-2xl">
            <Card title="Localização">
              <Input label="CEP" value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} icon={<MapPin size={15} />} placeholder="00000-000" />
              <Input label="Endereço completo" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rua, número, complemento..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" value={form.city} onChange={(e) => set('city', e.target.value)} />
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Estado</label>
                  <select
                    className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {form.address && (
              <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl overflow-hidden">
                <div className="h-48 bg-[#0f0f1a] flex items-center justify-center text-gray-600">
                  <div className="text-center">
                    <MapPin size={32} className="mx-auto mb-2 text-[#FF6B00]" />
                    <p className="text-sm text-white">{form.address}</p>
                    <p className="text-xs text-gray-500">{form.city} — {form.state}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Serviços ── */}
        {tab === 'services' && (
          <div className="space-y-5 max-w-2xl">
            <Card title="Tipos de atendimento">
              <p className="text-xs text-gray-500 -mt-1 mb-2">Selecione como os clientes podem pedir</p>
              <div className="grid grid-cols-3 gap-3">
                <ServiceToggle
                  icon={<Truck size={20} />}
                  label="Delivery"
                  sub="Entrega em casa"
                  active={form.acceptsDelivery}
                  onToggle={() => set('acceptsDelivery', !form.acceptsDelivery)}
                />
                <ServiceToggle
                  icon={<ShoppingBag size={20} />}
                  label="Retirada"
                  sub="Busca no local"
                  active={form.acceptsTakeaway}
                  onToggle={() => set('acceptsTakeaway', !form.acceptsTakeaway)}
                />
                <ServiceToggle
                  icon={<Utensils size={20} />}
                  label="Mesa"
                  sub="Consumo local"
                  active={form.acceptsDineIn}
                  onToggle={() => set('acceptsDineIn', !form.acceptsDineIn)}
                />
              </div>
            </Card>

            <Card title="Configurações de pedido">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5 flex items-center gap-1">
                    <DollarSign size={13} className="text-gray-500" /> Pedido mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white pl-9 pr-3 text-sm focus:border-[#FF6B00] outline-none"
                      value={form.minimumOrder}
                      onChange={(e) => set('minimumOrder', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5 flex items-center gap-1">
                    <Truck size={13} className="text-gray-500" /> Taxa de entrega
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white pl-9 pr-3 text-sm focus:border-[#FF6B00] outline-none"
                      value={form.deliveryFee}
                      onChange={(e) => set('deliveryFee', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5 flex items-center gap-1">
                    <Clock size={13} className="text-gray-500" /> Tempo estimado
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white pl-3 pr-10 text-sm focus:border-[#FF6B00] outline-none"
                      value={form.estimatedTime}
                      onChange={(e) => set('estimatedTime', Number(e.target.value))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">min</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Aparência ── */}
        {tab === 'branding' && (
          <div className="space-y-5 max-w-2xl">
            <Card title="Cores do cardápio">
              <p className="text-xs text-gray-500 -mt-1 mb-4">Personaliza a aparência do seu cardápio público</p>
              <div className="grid grid-cols-2 gap-6">
                <ColorPicker
                  label="Cor principal"
                  sub="Botões, destaques, preços"
                  value={form.primaryColor}
                  onChange={(v) => set('primaryColor', v)}
                />
                <ColorPicker
                  label="Cor de fundo"
                  sub="Background do cardápio"
                  value={form.secondaryColor}
                  onChange={(v) => set('secondaryColor', v)}
                />
              </div>
            </Card>

            <Card title="Pré-visualização">
              <div
                className="rounded-xl overflow-hidden border border-[#2d2d4f]"
                style={{ backgroundColor: form.secondaryColor }}
              >
                {form.bannerUrl && (
                  <img src={form.bannerUrl} alt="preview banner" className="w-full h-28 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: form.primaryColor + '30' }}>
                        <ChefHat size={20} style={{ color: form.primaryColor }} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-sm">{form.name || 'Seu Restaurante'}</p>
                      <p className="text-xs text-gray-400">{form.description?.slice(0, 40) || 'Sua descrição aqui...'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[{ label: 'Delivery', active: form.acceptsDelivery }, { label: 'Retirada', active: form.acceptsTakeaway }].map(({ label, active }) => active && (
                      <span key={label} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: form.primaryColor + '20', color: form.primaryColor }}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <button
                    className="mt-3 w-full py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    Ver cardápio
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB: Pagamento ── */}
        {tab === 'payment' && (
          <div className="space-y-5 max-w-2xl">
            <Card title="Chave Pix">
              <p className="text-xs text-gray-500 -mt-1 mb-3">Usada para pagamentos manuais no cardápio</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">Tipo</label>
                  <select
                    className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none"
                    value={form.pixKeyType}
                    onChange={(e) => set('pixKeyType', e.target.value)}
                  >
                    {PIX_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Input
                    label="Chave Pix"
                    value={form.pixKey}
                    onChange={(e) => set('pixKey', e.target.value)}
                    placeholder="Insira sua chave Pix"
                  />
                </div>
              </div>
              {form.pixKey && (
                <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Check size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 text-sm font-semibold">Pix configurado</p>
                    <p className="text-gray-400 text-xs">{form.pixKey}</p>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Métodos aceitos no cardápio">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pix', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
                  { label: 'Cartão (online)', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
                  { label: 'Dinheiro na entrega', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
                  { label: 'Máquina na entrega', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
                ].map(({ label, color }) => (
                  <div key={label} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${color}`}>
                    <Check size={14} />
                    {label}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Para configurar cartão online, acesse a aba Integrações e conecte com Stripe ou Asaas.</p>
            </Card>
          </div>
        )}

        {/* Floating save bar on mobile */}
        {saved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50">
            <Check size={16} />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable sub-components ──

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      {children}
    </div>
  );
}

function ServiceToggle({ icon, label, sub, active, onToggle }: {
  icon: React.ReactNode; label: string; sub: string; active: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
        active
          ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
          : 'border-[#2d2d4f] bg-[#0f0f1a] text-gray-500 hover:border-[#2d2d4f]/70'
      }`}
    >
      {icon}
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs opacity-70">{sub}</span>
      {active ? <Check size={14} /> : <X size={14} />}
    </button>
  );
}

function ColorPicker({ label, sub, value, onChange }: {
  label: string; sub: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">{label}</p>
      <p className="text-xs text-gray-500">{sub}</p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-xl border-2 border-[#2d2d4f] cursor-pointer bg-transparent p-1"
          />
        </div>
        <div>
          <p className="text-white text-sm font-mono font-semibold">{value}</p>
          <div className="w-32 h-2 rounded-full mt-1" style={{ backgroundColor: value }} />
        </div>
      </div>
    </div>
  );
}

function ImageUploadBox({ label, sublabel, value, onChange, inputRef, square }: {
  label: string; sublabel: string; value: string; onChange: (url: string) => void;
  inputRef: React.RefObject<HTMLInputElement>; square?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const targetRef = inputRef || ref;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-1">{label}</p>
      <p className="text-xs text-gray-600 mb-2">{sublabel}</p>
      <div
        className={`relative border-2 border-dashed border-[#2d2d4f] hover:border-[#FF6B00]/50 rounded-xl overflow-hidden cursor-pointer transition-colors group ${square ? 'aspect-square' : 'h-32'}`}
        onClick={() => targetRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 group-hover:text-gray-400 transition-colors">
            <Camera size={24} className="mb-2" />
            <span className="text-xs">Clique para upload</span>
          </div>
        )}
        <input
          ref={targetRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
