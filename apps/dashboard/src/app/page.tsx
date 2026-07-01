'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, ShoppingBag, UtensilsCrossed, Users, MessageCircle,
  BarChart3, Package, Printer, Star, Check, ArrowRight, Menu, X,
  Clock, Smartphone, Wallet, ChefHat
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.replace('/dashboard');
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [router]);

  const features = [
    { icon: ShoppingBag, title: 'Gestão de Pedidos', desc: 'Kanban em tempo real com notificações sonoras. Nunca perca um pedido.' },
    { icon: UtensilsCrossed, title: 'Cardápio Digital', desc: 'QR Code na mesa, delivery e retirada. Atualize produtos em segundos.' },
    { icon: MessageCircle, title: 'Bot WhatsApp', desc: 'Responde clientes automaticamente, envia status do pedido e confirma pagamentos.' },
    { icon: Users, title: 'CRM de Clientes', desc: 'Histórico completo, programa de fidelidade e segmentação para campanhas.' },
    { icon: BarChart3, title: 'Relatórios Financeiros', desc: 'Faturamento, ticket médio, produtos mais vendidos e muito mais.' },
    { icon: Package, title: 'Controle de Estoque', desc: 'Alertas automáticos de estoque baixo. Nunca fique sem ingredientes.' },
    { icon: ChefHat, title: 'Cozinha (KDS)', desc: 'Tela de produção para a cozinha sem papel. Pedidos organizados por prioridade.' },
    { icon: Printer, title: 'Impressora Térmica', desc: 'Impressão automática de pedidos na cozinha e no caixa.' },
    { icon: Wallet, title: 'PIX Automático', desc: 'QR Code PIX gerado automaticamente. Confirma pagamento sem intervenção.' },
  ];

  const testimonials = [
    { name: 'Carlos Mendes', role: 'Pizzaria Bella Napoli', text: 'Reduzi 40% do tempo no atendimento e aumentei o faturamento em 25% no primeiro mês.' },
    { name: 'Ana Paula', role: 'Hamburgueria The Smash', text: 'O bot do WhatsApp foi um divisor de águas. Meus clientes adoram receber o status do pedido automaticamente.' },
    { name: 'Roberto Lima', role: 'Restaurante Sabor & Arte', text: 'Sistema completo, fácil de usar. Minha equipe aprendeu em menos de 1 hora.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a14]/95 backdrop-blur border-b border-[#2d2d4f]' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF6B00] rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">ZappAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-gray-400 hover:text-white text-sm transition-colors">Funcionalidades</a>
            <a href="#preco" className="text-gray-400 hover:text-white text-sm transition-colors">Preço</a>
            <a href="#depoimentos" className="text-gray-400 hover:text-white text-sm transition-colors">Depoimentos</a>
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Entrar</Link>
            <Link href="/register" className="bg-[#FF6B00] hover:bg-[#e55f00] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Começar grátis
            </Link>
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#0d0d1a] border-b border-[#2d2d4f] px-4 py-4 space-y-3">
            <a href="#funcionalidades" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenu(false)}>Funcionalidades</a>
            <a href="#preco" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenu(false)}>Preço</a>
            <a href="#depoimentos" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenu(false)}>Depoimentos</a>
            <Link href="/login" className="block text-gray-400 hover:text-white text-sm">Entrar</Link>
            <Link href="/register" className="block bg-[#FF6B00] text-white px-4 py-2 rounded-lg text-sm font-medium text-center">Começar grátis</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap size={14} />
            7 dias grátis • Sem cartão de crédito
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Gerencie seu restaurante com{' '}
            <span className="text-[#FF6B00]">inteligência</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Cardápio digital, gestão de pedidos, bot WhatsApp, CRM, financeiro e muito mais. Tudo em uma plataforma feita para restaurantes brasileiros.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-[#FF6B00] hover:bg-[#e55f00] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-2">
              Criar conta grátis <ArrowRight size={20} />
            </Link>
            <a href="#funcionalidades" className="border border-[#2d2d4f] hover:border-[#FF6B00]/50 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors">
              Ver funcionalidades
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">Mais de 500 restaurantes já usam o ZappAI</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-16 bg-[#0d0d1a] border border-[#2d2d4f] rounded-2xl p-4 shadow-2xl shadow-[#FF6B00]/5">
          <div className="flex gap-1.5 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Pedidos Hoje', value: '47', color: 'text-[#FF6B00]' },
              { label: 'Faturamento', value: 'R$ 3.840', color: 'text-green-400' },
              { label: 'Ticket Médio', value: 'R$ 81,70', color: 'text-blue-400' },
              { label: 'Clientes', value: '312', color: 'text-purple-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#1a1a2e] rounded-xl p-3 text-left">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#1a1a2e] rounded-xl p-3 h-24 flex items-center justify-center">
            <div className="w-full h-12 flex items-end gap-1 px-2">
              {[30, 55, 40, 70, 45, 80, 60, 90, 50, 75, 85, 65].map((h, i) => (
                <div key={i} className="flex-1 bg-[#FF6B00]/30 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que seu restaurante precisa</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Uma plataforma completa para substituir 5 sistemas diferentes por um só.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#0d0d1a] border border-[#2d2d4f] hover:border-[#FF6B00]/40 rounded-xl p-6 transition-colors group">
                <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FF6B00]/20 transition-colors">
                  <Icon size={20} className="text-[#FF6B00]" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-14">Começe em 3 passos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Smartphone, title: 'Crie sua conta', desc: 'Cadastre seu restaurante em menos de 2 minutos. Sem burocracia.' },
              { step: '2', icon: UtensilsCrossed, title: 'Monte seu cardápio', desc: 'Adicione produtos, preços e fotos. Ative o QR Code para as mesas.' },
              { step: '3', icon: ShoppingBag, title: 'Receba pedidos', desc: 'Pedidos chegam em tempo real. Gerencie e acompanhe tudo pelo painel.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {step}
                </div>
                <Icon size={28} className="text-[#FF6B00] mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos clientes dizem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text }) => (
              <div key={name} className="bg-[#0d0d1a] border border-[#2d2d4f] rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-[#FF6B00] fill-[#FF6B00]" />)}
                </div>
                <p className="text-gray-300 text-sm mb-4">"{text}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preco" className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Preço simples e transparente</h2>
          <p className="text-gray-400 mb-10">Um plano completo. Sem taxas escondidas.</p>
          <div className="bg-[#0a0a14] border-2 border-[#FF6B00] rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-bold px-4 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <h3 className="text-2xl font-bold mb-1">Plano Pro</h3>
            <div className="flex items-end justify-center gap-1 my-4">
              <span className="text-gray-400 text-lg">R$</span>
              <span className="text-5xl font-extrabold text-[#FF6B00]">297</span>
              <span className="text-gray-400 mb-1">/mês</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">7 dias grátis • Cancele quando quiser</p>
            <ul className="space-y-3 text-sm text-left mb-8">
              {[
                'Cardápio digital com QR Code',
                'Gestão de pedidos Kanban',
                'Bot WhatsApp automático',
                'CRM de clientes',
                'Programa de fidelidade',
                'Relatórios financeiros',
                'Controle de estoque',
                'Cozinha (KDS)',
                'Impressora térmica',
                'PIX automático',
                'Suporte via WhatsApp',
                'Até 10 usuários por restaurante',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check size={16} className="text-[#FF6B00] shrink-0" />
                  <span className="text-gray-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="block bg-[#FF6B00] hover:bg-[#e55f00] text-white px-8 py-4 rounded-xl text-base font-semibold transition-colors text-center">
              Começar 7 dias grátis
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para transformar seu restaurante?</h2>
          <p className="text-gray-400 mb-8">Comece gratuitamente hoje. Sem cartão de crédito.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e55f00] text-white px-10 py-4 rounded-xl text-lg font-semibold transition-colors">
            Criar conta grátis <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d2d4f] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FF6B00] rounded flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold">ZappAI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#preco" className="hover:text-white transition-colors">Preço</a>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-white transition-colors">Cadastrar</Link>
          </div>
          <p className="text-sm text-gray-600">© 2026 ZappAI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
