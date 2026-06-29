'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Integrations {
  facebookPixelId: string;
  googleAnalyticsId: string;
  instagramHandle: string;
  ifoodStoreId: string;
}

export default function IntegrationsPage() {
  const [form, setForm] = useState<Integrations>({ facebookPixelId: '', googleAnalyticsId: '', instagramHandle: '', ifoodStoreId: '' });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    api.get('/restaurant/me').then(r => {
      const d = r.data;
      setForm({ facebookPixelId: d.facebookPixelId ?? '', googleAnalyticsId: d.googleAnalyticsId ?? '', instagramHandle: d.instagramHandle ?? '', ifoodStoreId: d.ifoodStoreId ?? '' });
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put('/restaurant/me', form); setSaved(true); setTimeout(() => setSaved(false), 2000); } finally { setSaving(false); }
  };

  const importMenu = async () => {
    if (!form.ifoodStoreId) return;
    setImporting(true); setImportMsg('');
    try {
      const r = await api.post('/restaurant/import-menu', { ifoodStoreId: form.ifoodStoreId });
      setImportMsg(`✓ ${r.data.imported} produtos importados com sucesso!`);
    } catch { setImportMsg('Erro ao importar. Verifique o ID da loja.'); } finally { setImporting(false); }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400 mt-1">Conecte ferramentas externas ao ZappAI</p>
      </div>

      {/* iFood Import */}
      <Card>
        <CardHeader><CardTitle>🛵 Importar cardápio do iFood</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">Cole o ID da sua loja no iFood para importar produtos, fotos e preços automaticamente. (Apenas importação — não integra pedidos.)</p>
          <div className="flex gap-3">
            <input
              placeholder="ID da loja iFood (ex: 123456)"
              value={form.ifoodStoreId}
              onChange={e => setForm(p => ({ ...p, ifoodStoreId: e.target.value }))}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button onClick={importMenu} disabled={importing || !form.ifoodStoreId} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-60">
              {importing ? 'Importando...' : 'Importar'}
            </button>
          </div>
          {importMsg && <p className={`text-sm ${importMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{importMsg}</p>}
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader><CardTitle>📊 Analytics e Pixel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Facebook Pixel ID</label>
            <input placeholder="123456789012345" value={form.facebookPixelId} onChange={e => setForm(p => ({ ...p, facebookPixelId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <p className="text-xs text-gray-500 mt-1">Rastreie conversões e crie públicos personalizados no Meta Ads</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Google Analytics ID (GA4)</label>
            <input placeholder="G-XXXXXXXXXX" value={form.googleAnalyticsId} onChange={e => setForm(p => ({ ...p, googleAnalyticsId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader><CardTitle>📱 Redes Sociais</CardTitle></CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-gray-300 mb-1">Instagram (@ sem @)</label>
          <input placeholder="seunome" value={form.instagramHandle} onChange={e => setForm(p => ({ ...p, instagramHandle: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </CardContent>
      </Card>

      <button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-60">
        {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar integrações'}
      </button>
    </div>
  );
}
