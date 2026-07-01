'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';
import api from '../../../../lib/api';
import {
  Printer, Plus, Wifi, WifiOff, Trash2, Download, CheckCircle,
  Monitor, Usb, Globe, Copy, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

const STEPS = [
  { icon: Download, title: 'Baixe o Print Agent', desc: 'Instale o ZappAI Print Agent no computador conectado à impressora.' },
  { icon: Printer, title: 'Cadastre a impressora', desc: 'Clique em "Adicionar Impressora" e preencha o nome e tipo de conexão.' },
  { icon: Copy, title: 'Copie o ID da impressora', desc: 'Após criar, copie o ID gerado e cole na configuração do Print Agent.' },
  { icon: CheckCircle, title: 'Pronto!', desc: 'A impressora ficará Online automaticamente e imprimirá novos pedidos.' },
];

export default function PrintersPage() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Record<string, any[]>>({});
  const [form, setForm] = useState({
    name: '',
    type: 'usb',
    connectionString: '',
    paperWidth: 80,
    printOnNewOrder: true,
    printOnReady: false,
  });

  useEffect(() => { loadPrinters(); }, []);

  const loadPrinters = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/printers');
      setPrinters(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/printers', form);
      setShowModal(false);
      setForm({ name: '', type: 'usb', connectionString: '', paperWidth: 80, printOnNewOrder: true, printOnReady: false });
      await loadPrinters();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta impressora?')) return;
    await api.delete(`/printers/${id}`);
    loadPrinters();
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleJobs = async (printerId: string) => {
    if (expandedJobs === printerId) {
      setExpandedJobs(null);
      return;
    }
    setExpandedJobs(printerId);
    if (!jobs[printerId]) {
      try {
        const { data } = await api.get(`/printers/${printerId}/jobs`);
        setJobs((j) => ({ ...j, [printerId]: data }));
      } catch {
        setJobs((j) => ({ ...j, [printerId]: [] }));
      }
    }
  };

  const jobStatusLabel: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Aguardando', color: 'text-yellow-400' },
    PRINTING: { label: 'Imprimindo', color: 'text-blue-400' },
    DONE: { label: 'Impresso', color: 'text-green-400' },
    ERROR: { label: 'Erro', color: 'text-red-400' },
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl space-y-6">

        {/* How it works */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Como configurar a impressora</h2>
          <p className="text-sm text-gray-400 mb-6">Impressão automática de pedidos via Print Agent local</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl flex items-center justify-center relative">
                  <Icon size={18} className="text-[#FF6B00]" />
                  <span className="absolute -top-2 -left-2 w-5 h-5 bg-[#FF6B00] rounded-full text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                </div>
                <p className="text-white text-xs font-semibold">{title}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg p-3">
            <Monitor size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-white text-xs font-medium">ZappAI Print Agent</p>
              <p className="text-gray-500 text-xs">Compatível com Windows e Linux. Requer Java 11+.</p>
            </div>
            <button className="flex items-center gap-1.5 bg-[#FF6B00] hover:bg-[#e55f00] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Download size={12} />
              Baixar
            </button>
          </div>
        </div>

        {/* Printers list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Impressoras cadastradas</h3>
            <div className="flex items-center gap-2">
              <button onClick={loadPrinters} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a2e] transition-colors">
                <RefreshCw size={15} />
              </button>
              <Button onClick={() => setShowModal(true)} size="sm">
                <Plus size={14} />
                Adicionar Impressora
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
              <div className="animate-spin w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full" />
              Carregando...
            </div>
          ) : printers.length === 0 ? (
            <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl py-14 text-center">
              <Printer size={36} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">Nenhuma impressora configurada</p>
              <p className="text-gray-600 text-xs mt-1">Clique em "Adicionar Impressora" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {printers.map((printer) => (
                <div key={printer.id} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${printer.isOnline ? 'bg-green-500/10' : 'bg-[#2d2d4f]'}`}>
                          <Printer size={20} className={printer.isOnline ? 'text-green-400' : 'text-gray-500'} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{printer.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {printer.type === 'usb' ? <Usb size={10} /> : <Globe size={10} />}
                              {printer.type.toUpperCase()} • {printer.paperWidth}mm
                            </span>
                            {printer.isOnline ? (
                              <span className="flex items-center gap-1 text-green-400 text-xs">
                                <Wifi size={10} />
                                Online {printer.agentVersion && `v${printer.agentVersion}`}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500 text-xs">
                                <WifiOff size={10} />
                                Offline
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleJobs(printer.id)}
                          className="text-gray-400 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2d2d4f] transition-colors"
                        >
                          Histórico
                          {expandedJobs === printer.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <button onClick={() => handleDelete(printer.id)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Printer ID for agent config */}
                    <div className="mt-4 flex items-center gap-2 bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-500 text-xs mb-0.5">ID da impressora (use no Print Agent)</p>
                        <p className="text-gray-300 text-xs font-mono truncate">{printer.id}</p>
                      </div>
                      <button
                        onClick={() => copyId(printer.id)}
                        className="text-gray-400 hover:text-[#FF6B00] transition-colors shrink-0"
                      >
                        {copiedId === printer.id ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="flex gap-4 mt-3">
                      {printer.printOnNewOrder && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CheckCircle size={10} className="text-[#FF6B00]" />
                          Imprime em novos pedidos
                        </span>
                      )}
                      {printer.printOnReady && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <CheckCircle size={10} className="text-[#FF6B00]" />
                          Imprime quando pronto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Print jobs history */}
                  {expandedJobs === printer.id && (
                    <div className="border-t border-[#2d2d4f] bg-[#0f0f1a] p-4">
                      <p className="text-xs text-gray-500 mb-3 font-medium">Últimas impressões</p>
                      {!jobs[printer.id] ? (
                        <p className="text-gray-600 text-xs text-center py-4">Carregando...</p>
                      ) : jobs[printer.id].length === 0 ? (
                        <p className="text-gray-600 text-xs text-center py-4">Nenhuma impressão registrada</p>
                      ) : (
                        <div className="space-y-2">
                          {jobs[printer.id].slice(0, 10).map((job: any) => {
                            const s = jobStatusLabel[job.status] || { label: job.status, color: 'text-gray-400' };
                            return (
                              <div key={job.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">{job.template} — {new Date(job.createdAt).toLocaleString('pt-BR')}</span>
                                <span className={s.color}>{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent info */}
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-5 flex gap-4">
          <AlertCircle size={20} className="text-[#FF6B00] shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400 space-y-1">
            <p className="text-white font-medium">Impressoras compatíveis</p>
            <p>Qualquer impressora térmica de 58mm ou 80mm com conexão USB, Rede (IP) ou Serial. As mais comuns no Brasil: <span className="text-white">Elgin i9, Bematech MP-4200, Epson TM-T20</span>.</p>
            <p className="text-xs text-gray-500 mt-2">O Print Agent deve estar rodando no computador que tem a impressora conectada. Ele se conecta automaticamente ao ZappAI via WebSocket.</p>
          </div>
        </div>

      </div>

      {/* Add printer modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Adicionar Impressora">
        <div className="space-y-4">
          <Input
            label="Nome da impressora"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Impressora Cozinha"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Tipo de conexão</label>
              <select
                className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="usb">USB</option>
                <option value="network">Rede (IP)</option>
                <option value="serial">Serial</option>
                <option value="bluetooth">Bluetooth</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Largura do papel</label>
              <select
                className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none"
                value={form.paperWidth}
                onChange={(e) => setForm((f) => ({ ...f, paperWidth: Number(e.target.value) }))}
              >
                <option value={58}>58mm</option>
                <option value={80}>80mm (mais comum)</option>
              </select>
            </div>
          </div>

          {form.type === 'network' && (
            <Input
              label="Endereço IP e porta"
              value={form.connectionString}
              onChange={(e) => setForm((f) => ({ ...f, connectionString: e.target.value }))}
              placeholder="192.168.1.100:9100"
            />
          )}

          <div className="bg-[#0f0f1a] border border-[#2d2d4f] rounded-lg p-4 space-y-3">
            <p className="text-xs text-gray-400 font-medium">Quando imprimir automaticamente?</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.printOnNewOrder}
                onChange={(e) => setForm((f) => ({ ...f, printOnNewOrder: e.target.checked }))}
                className="accent-[#FF6B00] w-4 h-4"
              />
              <div>
                <p className="text-sm text-white">Ao receber novo pedido</p>
                <p className="text-xs text-gray-500">Imprime a comanda assim que o pedido chegar</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.printOnReady}
                onChange={(e) => setForm((f) => ({ ...f, printOnReady: e.target.checked }))}
                className="accent-[#FF6B00] w-4 h-4"
              />
              <div>
                <p className="text-sm text-white">Quando o pedido estiver pronto</p>
                <p className="text-xs text-gray-500">Imprime ao mover para "Pronto" no kanban</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} loading={saving} className="flex-1">
              Adicionar Impressora
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
