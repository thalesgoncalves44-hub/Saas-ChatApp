'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import { Badge } from '../../../components/ui/badge';
import { formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { Plus, Send, Megaphone } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', subject: '', message: '', channel: 'WHATSAPP', targetSegment: '',
  });

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data } = await api.get('/campaigns');
    setCampaigns(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    await api.post('/campaigns', form);
    setShowModal(false);
    setForm({ name: '', subject: '', message: '', channel: 'WHATSAPP', targetSegment: '' });
    loadCampaigns();
  };

  const handleSend = async (id: string) => {
    if (!confirm('Enviar esta campanha agora?')) return;
    setSending(id);
    try {
      await api.post(`/campaigns/${id}/send`);
      loadCampaigns();
    } finally {
      setSending(null);
    }
  };

  const STATUS_BADGE: Record<string, string> = {
    DRAFT: 'default', SCHEDULED: 'info', SENDING: 'warning', SENT: 'success', CANCELLED: 'error',
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Campanhas" subtitle="Marketing via WhatsApp e e-mail" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowModal(true)}><Plus size={14} />Nova Campanha</Button>
        </div>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center">
                <Megaphone size={20} className="text-[#FF6B00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{campaign.name}</h3>
                  <Badge variant={STATUS_BADGE[campaign.status] as any}>{campaign.status}</Badge>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">{campaign.message}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-600">
                  <span>{campaign.channel}</span>
                  {campaign.targetSegment && <span>Segmento: {campaign.targetSegment}</span>}
                  <span>{campaign.sentCount}/{campaign.recipientCount} enviados</span>
                  {campaign.sentAt && <span>Enviado em {formatDate(campaign.sentAt)}</span>}
                </div>
              </div>
              {campaign.status === 'DRAFT' && (
                <Button size="sm" onClick={() => handleSend(campaign.id)} loading={sending === campaign.id}>
                  <Send size={12} />Enviar
                </Button>
              )}
            </div>
          ))}
          {!loading && campaigns.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">📢</p>
              <p className="text-lg font-medium">Nenhuma campanha criada</p>
            </div>
          )}
        </div>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Campanha">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Canal</label>
              <select className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="EMAIL">E-mail</option>
                <option value="BOTH">Ambos</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Segmento</label>
              <select className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none" value={form.targetSegment} onChange={(e) => setForm((f) => ({ ...f, targetSegment: e.target.value }))}>
                <option value="">Todos os clientes</option>
                <option value="loyal">Fiéis</option>
                <option value="regular">Regulares</option>
                <option value="at_risk">Em risco</option>
                <option value="lost">Perdidos</option>
              </select>
            </div>
          </div>
          {form.channel !== 'WHATSAPP' && <Input label="Assunto (e-mail)" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Mensagem</label>
            <textarea
              className="w-full h-28 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 py-2 text-sm resize-none focus:border-[#FF6B00] outline-none"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Use {{name}} para personalizar com o nome do cliente..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} className="flex-1">Criar Campanha</Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
