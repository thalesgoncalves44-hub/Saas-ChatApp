'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, ShoppingBag, UtensilsCrossed, Users, MessageCircle,
  BarChart3, Package, Printer, Star, Check, ArrowRight, Menu, X,
  Smartphone, Wallet, ChefHat, Shield, Clock, ChevronDown, ChevronUp,
  TrendingUp, Award, Headphones
} from 'lucide-react';

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [countStarted, setCountStarted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [urgencyDismissed, setUrgencyDismissed] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const restaurants = useCountUp(500, 2000, countStarted);
  const orders = useCountUp(120000, 2500, countStarted);
  const revenue = useCountUp(8, 2000, countStarted);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) { router.replace('/dashboard'); return; }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCountStarted(true); }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
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
    { name: 'Carlos Mendes', role: 'Pizzaria Bella Napoli — SP', text: 'Reduzi 40% do tempo no atendimento e aumentei o faturamento em 25% no primeiro mês. Melhor investimento que fiz.', stars: 5 },
    { name: 'Ana Paula Costa', role: 'Hamburgueria The Smash — RJ', text: 'O bot do WhatsApp foi um divisor de águas. Meus clientes adoram receber o status do pedido automaticamente.', stars: 5 },
    { name: 'Roberto Lima', role: 'Restaurante Sabor & Arte — MG', text: 'Sistema completo, fácil de usar. Minha equipe aprendeu em menos de 1 hora. Suporte excelente!', stars: 5 },
    { name: 'Fernanda Souza', role: 'Sushi Kokoro — PR', text: 'Finalmente um sistema que integra tudo. Cardápio, pedidos, financeiro e WhatsApp em um só lugar.', stars: 5 },
    { name: 'Marcos Oliveira', role: 'Churrascaria Gaúcha — RS', text: 'O controle de estoque me salvou várias vezes. Os alertas automáticos evitam que a gente fique sem produto.', stars: 5 },
    { name: 'Juliana Neves', role: 'Café Aconchego — DF', text: 'Aumentei minhas vendas online em 60% com o cardápio digital e o QR Code nas mesas. Incrível!', stars: 5 },
  ];

  const faqs = [
    { q: '💰 Realmente não tem taxa por pedido?', a: 'Sim, 100% real! Você paga apenas a mensalidade fixa de R$ 207/mês e pode processar quantos pedidos quiser — 10 pedidos ou 10.000 pedidos por mês, o preço é o mesmo. Nenhum centavo a mais por pedido.' },
    { q: 'Preciso de conhecimento técnico para usar?', a: 'Não! O ZappAI foi criado para ser simples. Qualquer pessoa consegue cadastrar o restaurante, montar o cardápio e começar a receber pedidos em menos de 1 hora.' },
    { q: 'Como funciona o período de teste gratuito?', a: '7 dias completamente grátis, sem precisar de cartão de crédito. Você usa todas as funcionalidades do Plano Pro sem nenhuma restrição.' },
    { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa ou fidelidade. Cancele quando quiser diretamente pelo painel de configurações, sem precisar entrar em contato com ninguém.' },
    { q: 'O sistema funciona para delivery, mesa e retirada?', a: 'Sim! O ZappAI suporta os 3 modos: delivery com área de entrega configurável, pedidos na mesa via QR Code e retirada no balcão.' },
    { q: 'Quantos restaurantes posso gerenciar?', a: 'Cada conta gerencia 1 restaurante. Se você tiver múltiplas unidades, crie uma conta para cada uma. Entre em contato para desconto em multi-unidades.' },
    { q: 'O bot do WhatsApp é complicado de configurar?', a: 'Não! Basta escanear um QR Code com seu WhatsApp Business e o bot já começa a funcionar automaticamente.' },
  ];

  const partners = ['Pizzaria Bella', 'The Smash', 'Sabor & Arte', 'Sushi Kokoro', 'Churrascaria Gaúcha', 'Café Aconchego'];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">

      {/* Urgency Banner */}
      {!urgencyDismissed && (
        <div className="bg-[#FF6B00] text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2 relative">
          <Clock size={14} />
          <span><strong>Oferta especial:</strong> Primeiros 3 meses com 30% de desconto. Taxa fixa — <strong>zero taxa por pedido</strong>. Válido até 31/07/2026.</span>
          <button onClick={() => setUrgencyDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a14]/95 backdrop-blur border-b border-[#2d2d4f]' : 'bg-transparent'}`}>
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
            <a href="#faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a>
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
            <a href="#faq" className="block text-gray-400 hover:text-white text-sm" onClick={() => setMobileMenu(false)}>FAQ</a>
            <Link href="/login" className="block text-gray-400 hover:text-white text-sm">Entrar</Link>
            <Link href="/register" className="block bg-[#FF6B00] text-white px-4 py-2 rounded-lg text-sm font-medium text-center">Começar grátis</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 text-center">
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
            <a href="#video" className="border border-[#2d2d4f] hover:border-[#FF6B00]/50 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors">
              Ver demonstração
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">✓ Sem cartão &nbsp;✓ 7 dias grátis &nbsp;✓ Cancele quando quiser &nbsp;✓ <strong className="text-[#FF6B00]">Sem taxa por pedido</strong></p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-14 bg-[#0d0d1a] border border-[#2d2d4f] rounded-2xl p-4 shadow-2xl shadow-[#FF6B00]/5">
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
          <div className="bg-[#1a1a2e] rounded-xl p-3 h-24 flex items-end gap-1 px-4">
            {[30, 55, 40, 70, 45, 80, 60, 90, 50, 75, 85, 65].map((h, i) => (
              <div key={i} className="flex-1 bg-[#FF6B00]/30 rounded-t hover:bg-[#FF6B00]/50 transition-colors" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </section>

      {/* Animated Stats */}
      <section ref={statsRef} className="py-14 px-4 bg-[#0d0d1a] border-y border-[#2d2d4f]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-5xl font-extrabold text-[#FF6B00]">{restaurants}+</p>
            <p className="text-gray-400 mt-2">Restaurantes ativos</p>
          </div>
          <div>
            <p className="text-5xl font-extrabold text-[#FF6B00]">{orders.toLocaleString('pt-BR')}+</p>
            <p className="text-gray-400 mt-2">Pedidos processados</p>
          </div>
          <div>
            <p className="text-5xl font-extrabold text-[#FF6B00]">R$ {revenue}M+</p>
            <p className="text-gray-400 mt-2">Em vendas geradas</p>
          </div>
        </div>
      </section>

      {/* No Per-Order Fee Highlight */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#FF6B00]/10 via-[#FF6B00]/5 to-[#FF6B00]/10 border-2 border-[#FF6B00]/40 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#FF6B00_0%,_transparent_70%)] opacity-5 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-[#FF6B00] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                Nosso maior diferencial
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                Pagamento fixo.<br />
                <span className="text-[#FF6B00]">Zero taxa por pedido.</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                Enquanto outros sistemas cobram <strong className="text-white">R$ 0,99 a R$ 2,00 por pedido</strong>, no ZappAI você paga um valor fixo por mês e fica com <strong className="text-white">100% do seu lucro</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-[#0d0d1a] border border-[#2d2d4f] rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Sistema com taxa de 1%</p>
                  <p className="text-red-400 font-bold text-lg">−R$ 384/mês</p>
                  <p className="text-gray-500 text-xs">em 384 pedidos de R$ 100</p>
                </div>
                <div className="bg-[#FF6B00]/10 border-2 border-[#FF6B00] rounded-xl p-4">
                  <p className="text-[#FF6B00] text-xs font-bold mb-1">ZappAI — taxa fixa</p>
                  <p className="text-white font-bold text-lg">R$ 0 de taxa</p>
                  <p className="text-gray-400 text-xs">em qualquer volume de pedidos</p>
                </div>
                <div className="bg-[#0d0d1a] border border-[#2d2d4f] rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Economia anual estimada</p>
                  <p className="text-green-400 font-bold text-lg">+R$ 4.608/ano</p>
                  <p className="text-gray-500 text-xs">que ficam no seu bolso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Partner logos */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-6">Confiado por restaurantes em todo o Brasil</p>
          <div className="flex flex-wrap justify-center gap-6">
            {partners.map((name) => (
              <div key={name} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-lg px-5 py-2.5 text-gray-400 text-sm font-medium">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section id="video" className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Veja o ZappAI em ação</h2>
          <p className="text-gray-400 mb-10">2 minutos para entender como funciona na prática</p>
          <div className="relative bg-[#0a0a14] border border-[#2d2d4f] rounded-2xl overflow-hidden aspect-video flex items-center justify-center group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/10 to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-[#FF6B00] rounded-full flex items-center justify-center shadow-lg shadow-[#FF6B00]/30 group-hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-gray-400 text-sm">Demonstração do sistema completo</p>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">2:14</div>
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

      {/* Comparison */}
      <section className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ZappAI vs sistemas tradicionais</h2>
            <p className="text-gray-400">Veja por que centenas de restaurantes migraram para o ZappAI</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium w-1/2">Funcionalidade</th>
                  <th className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-5 h-5 bg-[#FF6B00] rounded flex items-center justify-center"><Zap size={12} className="text-white" /></div>
                      <span className="text-[#FF6B00] font-bold">ZappAI</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center text-gray-500 font-medium">Sistemas tradicionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d4f]">
                {[
                  ['Cardápio digital com QR Code', true, false],
                  ['Bot WhatsApp automático', true, false],
                  ['PIX automático integrado', true, false],
                  ['CRM e programa de fidelidade', true, false],
                  ['Atualização em tempo real', true, true],
                  ['Relatórios financeiros completos', true, false],
                  ['Suporte em português', true, true],
                  ['💰 Pagamento fixo — zero taxa por pedido', true, false],
                  ['Cancele quando quiser', true, false],
                ].map(([feat, zapp, trad], i) => (
                  <tr key={i} className={`hover:bg-[#1a1a2e]/50 transition-colors ${(feat as string).startsWith('💰') ? 'bg-[#FF6B00]/5 border-l-2 border-l-[#FF6B00]' : ''}`}>
                    <td className={`py-3 px-4 ${(feat as string).startsWith('💰') ? 'text-white font-semibold' : 'text-gray-300'}`}>{feat as string}</td>
                    <td className="py-3 px-4 text-center">
                      {zapp ? <span className="text-green-400 text-lg">✓</span> : <span className="text-red-400 text-lg">✗</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {trad ? <span className="text-green-400 text-lg">✓</span> : <span className="text-red-400 text-lg">✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-14">Começe em 3 passos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: Smartphone, title: 'Crie sua conta', desc: 'Cadastre seu restaurante em menos de 2 minutos. Sem burocracia.' },
              { step: '2', icon: UtensilsCrossed, title: 'Monte seu cardápio', desc: 'Adicione produtos, preços e fotos. Ative o QR Code para as mesas.' },
              { step: '3', icon: ShoppingBag, title: 'Receba pedidos', desc: 'Pedidos chegam em tempo real. Gerencie tudo pelo painel.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step}>
                <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">{step}</div>
                <Icon size={28} className="text-[#FF6B00] mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos clientes dizem</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-[#FF6B00] fill-[#FF6B00]" />)}</div>
              <span className="text-gray-400 text-sm">4.9/5 baseado em 200+ avaliações</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, stars }) => (
              <div key={name} className="bg-[#0a0a14] border border-[#2d2d4f] rounded-xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(stars)].map((_, i) => <Star key={i} size={14} className="text-[#FF6B00] fill-[#FF6B00]" />)}
                </div>
                <p className="text-gray-300 text-sm mb-5">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#FF6B00]/20 rounded-full flex items-center justify-center text-[#FF6B00] font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preco" className="py-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Preço simples e transparente</h2>
          <p className="text-gray-400 mb-10">Um plano completo. Sem taxas por pedido. Sem surpresas.</p>
          <div className="bg-[#0d0d1a] border-2 border-[#FF6B00] rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
              🔥 30% OFF — PRIMEIROS 3 MESES
            </div>
            <h3 className="text-2xl font-bold mb-1">Plano Pro</h3>
            <div className="inline-flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full mt-2 mb-3">
              ✓ PAGAMENTO FIXO — SEM TAXA POR PEDIDO
            </div>
            <div className="flex items-end justify-center gap-1 my-4">
              <span className="text-gray-400 line-through text-lg mr-2">R$ 297</span>
              <span className="text-gray-400 text-lg">R$</span>
              <span className="text-5xl font-extrabold text-[#FF6B00]">207</span>
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

            {/* Guarantee */}
            <div className="mt-6 flex items-center justify-center gap-3 bg-[#1a1a2e] rounded-xl p-4">
              <Shield size={28} className="text-green-400 shrink-0" />
              <div className="text-left">
                <p className="text-white text-sm font-semibold">Garantia de 30 dias</p>
                <p className="text-gray-400 text-xs">Se não ficar satisfeito, devolvemos 100% do seu dinheiro.</p>
              </div>
            </div>

            {/* Payment methods */}
            <div className="mt-4">
              <p className="text-gray-500 text-xs mb-3">Formas de pagamento aceitas</p>
              <div className="flex items-center justify-center gap-3">
                <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded px-3 py-1.5 text-xs font-bold text-blue-400">PIX</div>
                <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded px-3 py-1.5 text-xs font-bold text-yellow-400">VISA</div>
                <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded px-3 py-1.5 text-xs font-bold text-red-400">MASTER</div>
                <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded px-3 py-1.5 text-xs font-bold text-green-400">ELO</div>
                <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded px-3 py-1.5 text-xs font-bold text-purple-400">AMEX</div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Shield, label: 'Dados seguros', sub: 'SSL + criptografia' },
              { icon: Award, label: 'Suporte humano', sub: 'Seg a Sab, 8h–22h' },
              { icon: TrendingUp, label: 'Sempre atualizado', sub: 'Novas funções grátis' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <Icon size={22} className="text-[#FF6B00]" />
                <p className="text-white text-xs font-semibold">{label}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-[#0d0d1a]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="bg-[#0a0a14] border border-[#2d2d4f] rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#1a1a2e]/30 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-white text-sm">{q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-[#FF6B00] shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-400 border-t border-[#2d2d4f] pt-4">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <Headphones size={14} />
            Suporte disponível agora via WhatsApp
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para transformar seu restaurante?</h2>
          <p className="text-gray-400 mb-8">Junte-se a mais de 500 restaurantes que já aumentaram seu faturamento com o ZappAI.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e55f00] text-white px-10 py-4 rounded-xl text-lg font-semibold transition-colors">
            Criar conta grátis <ArrowRight size={20} />
          </Link>
          <p className="text-sm text-gray-500 mt-4">✓ 7 dias grátis &nbsp;✓ Sem cartão de crédito &nbsp;✓ Garantia de 30 dias</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d2d4f] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#FF6B00] rounded flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold">ZappAI</span>
              <span className="text-gray-600 text-sm ml-2">Gestão inteligente para restaurantes</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#preco" className="hover:text-white transition-colors">Preço</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
              <Link href="/register" className="hover:text-white transition-colors">Cadastrar</Link>
            </div>
          </div>
          <div className="border-t border-[#2d2d4f] mt-6 pt-6 text-center text-sm text-gray-600">
            © 2026 ZappAI. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
