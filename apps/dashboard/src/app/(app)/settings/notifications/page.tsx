'use client';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Prefs {
  emailNewOrder: boolean;
  emailDailySummary: boolean;
  emailLowStock: boolean;
  whatsappNewOrder: boolean;
  whatsappOrderStatus: boolean;
  soundNewOrder: boolean;
  pushNewOrder: boolean;
}

const DEFAULTS: Prefs = {
  emailNewOrder: true, emailDailySummary: true, emailLowStock: true,
  whatsappNewOrder: false, whatsappOrderStatus: true,
  soundNewOrder: true, pushNewOrder: false,
};

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notif_prefs');
      return saved ? JSON.parse(saved) : DEFAULTS;
    }
    return DEFAULTS;
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const save = () => {
    localStorage.setItem('notif_prefs', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Row = ({ label, desc, k }: { label: string; desc: string; k: keyof Prefs }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Switch checked={prefs[k]} onCheckedChange={() => toggle(k)} />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notificações</h1>
        <p className="text-gray-400 mt-1">Configure como e quando deseja ser notificado</p>
      </div>

      <Card>
        <CardHeader><CardTitle>📧 E-mail</CardTitle></CardHeader>
        <CardContent>
          <Row label="Novo pedido" desc="Receber e-mail a cada novo pedido recebido" k="emailNewOrder" />
          <Row label="Resumo diário" desc="Receber um resumo do dia todo às 23h" k="emailDailySummary" />
          <Row label="Estoque baixo" desc="Ser alertado quando um produto atingir estoque mínimo" k="emailLowStock" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>💬 WhatsApp</CardTitle></CardHeader>
        <CardContent>
          <Row label="Novo pedido no WhatsApp" desc="Receber mensagem no seu WhatsApp a cada pedido" k="whatsappNewOrder" />
          <Row label="Atualização de status" desc="Notificar quando pedido mudar de status" k="whatsappOrderStatus" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>🔔 Painel (browser)</CardTitle></CardHeader>
        <CardContent>
          <Row label="Som de alerta" desc="Tocar som ao receber novo pedido no painel" k="soundNewOrder" />
          <Row label="Push notification" desc="Notificação push mesmo com o navegador minimizado (requer permissão)" k="pushNewOrder" />
        </CardContent>
      </Card>

      <button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
        {saved ? '✓ Preferências salvas!' : 'Salvar preferências'}
      </button>
    </div>
  );
}
