'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Check, ChevronRight, Store, Clock, UtensilsCrossed, Smartphone } from 'lucide-react';

const STEPS = [
  { key: 'restaurant', label: 'Seu restaurante', icon: Store, description: 'Configure as informações básicas' },
  { key: 'hours', label: 'Horários', icon: Clock, description: 'Defina quando você funciona' },
  { key: 'menu', label: 'Cardápio', icon: UtensilsCrossed, description: 'Adicione categorias e produtos' },
  { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone, description: 'Conecte o WhatsApp Business' },
];

const DAYS = [
  { key: 1, label: 'Seg' }, { key: 2, label: 'Ter' }, { key: 3, label: 'Qua' },
  { key: 4, label: 'Qui' }, { key: 5, label: 'Sex' }, { key: 6, label: 'Sáb' }, { key: 0, label: 'Dom' },
];

export default function OnboardingPage() {
  const { step } = useParams<{ step: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  // Restaurant step
  const [restForm, setRestForm] = useState({ name: '', description: '', phone: '', address: '' });

  // Hours step
  const [openDays, setOpenDays] = useState([1, 2, 3, 4, 5]);
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');

  // Menu step
  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState([{ name: '', price: '' }]);

  // WhatsApp step - just info

  useEffect(() => {
    if (step === 'restaurant') {
      api
        .get('/restaurant')
        .then((r) => {
          setRestForm({
            name: r.data.name || '',
            description: r.data.description || '',
            phone: r.data.phone || '',
            address: r.data.address || '',
          });
        })
        .catch(() => {});
    }
  }, [step]);

  const goNext = () => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < STEPS.length) {
      router.push(`/onboarding/${STEPS[nextIdx].key}`);
    } else {
      router.push('/dashboard');
    }
  };

  const handleRestaurantSave = async () => {
    setLoading(true);
    setError('');
    try {
      await api.put('/restaurant', restForm);
      goNext();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursSave = async () => {
    setLoading(true);
    setError('');
    try {
      const hours = DAYS.map((d) => ({
        dayOfWeek: d.key,
        isOpen: openDays.includes(d.key),
        openTime,
        closeTime,
      }));
      await api.put('/restaurant/operating-hours', { hours });
      goNext();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao salvar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSave = async () => {
    if (!categoryName.trim()) {
      setError('Digite o nome da categoria');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const catRes = await api.post('/categories', { name: categoryName });
      const categoryId = catRes.data.id;
      const validProducts = products.filter((p) => p.name && p.price);
      await Promise.all(
        validProducts.map((p) =>
          api.post('/products', { name: p.name, price: parseFloat(p.price), categoryId }),
        ),
      );
      goNext();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao criar cardápio');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'restaurant':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Nome do restaurante *</label>
              <input
                value={restForm.name}
                onChange={(e) => setRestForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Meu Restaurante"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Descrição</label>
              <textarea
                value={restForm.description}
                onChange={(e) => setRestForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Conte sobre seu restaurante..."
                rows={3}
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00] resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Telefone / WhatsApp</label>
              <input
                value={restForm.phone}
                onChange={(e) => setRestForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Endereço</label>
              <input
                value={restForm.address}
                onChange={(e) => setRestForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Rua Exemplo, 123, Bairro, Cidade"
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00]"
              />
            </div>
            <Button size="lg" className="w-full" loading={loading} onClick={handleRestaurantSave}>
              Continuar <ChevronRight size={16} />
            </Button>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Dias de funcionamento</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() =>
                      setOpenDays((prev) =>
                        prev.includes(d.key) ? prev.filter((x) => x !== d.key) : [...prev, d.key],
                      )
                    }
                    className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${
                      openDays.includes(d.key) ? 'bg-[#FF6B00] text-white' : 'bg-[#1a1a2e] text-gray-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Abre às</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Fecha às</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>
            <Button size="lg" className="w-full" loading={loading} onClick={handleHoursSave}>
              Continuar <ChevronRight size={16} />
            </Button>
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Nome da primeira categoria</label>
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Ex: Lanches, Pizzas, Bebidas..."
                className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-4 py-3 text-white outline-none focus:border-[#FF6B00]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Produtos (opcional)</label>
              <div className="space-y-2">
                {products.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={p.name}
                      onChange={(e) =>
                        setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                      }
                      placeholder="Nome do produto"
                      className="flex-1 bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R$</span>
                      <input
                        value={p.price}
                        onChange={(e) =>
                          setProducts((prev) => prev.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x)))
                        }
                        placeholder="0,00"
                        type="number"
                        step="0.01"
                        className="w-full bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg pl-7 pr-2 py-2.5 text-white text-sm outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setProducts((prev) => [...prev, { name: '', price: '' }])}
                className="text-[#FF6B00] text-sm mt-2 hover:underline"
              >
                + Adicionar produto
              </button>
            </div>
            <Button size="lg" className="w-full" loading={loading} onClick={handleMenuSave}>
              Continuar <ChevronRight size={16} />
            </Button>
            <button onClick={goNext} className="w-full text-gray-500 text-sm hover:text-gray-300 py-2">
              Pular este passo
            </button>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-4">
            <div className="bg-[#1a1a2e] rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-white">Como conectar o WhatsApp</h3>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  Acesse <strong className="text-white">Configurações &gt; WhatsApp</strong> após concluir o onboarding
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  Clique em <strong className="text-white">Criar instância</strong> e aguarde
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  Escaneie o QR Code com o WhatsApp do seu celular
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  Pronto! O bot responderá automaticamente seus clientes
                </li>
              </ol>
            </div>
            <Button size="lg" className="w-full" onClick={goNext}>
              Ir para o dashboard <ChevronRight size={16} />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStep = STEPS[currentStepIdx];

  if (!currentStep) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-white">
            Zapp<span className="text-[#FF6B00]">AI</span>
          </span>
          <p className="text-gray-500 text-sm mt-1">Configure seu restaurante em minutos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isDone ? 'bg-green-500' : isActive ? 'bg-[#FF6B00]' : 'bg-[#1a1a2e]'
                    }`}
                  >
                    {isDone ? <Check size={18} className="text-white" /> : <Icon size={18} className={isActive ? 'text-white' : 'text-gray-600'} />}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-gray-600'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-green-500' : 'bg-[#2d2d4f]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-[#1a1a2e]/50 rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">{currentStep.label}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{currentStep.description}</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {renderStep()}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          Passo {currentStepIdx + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  );
}
