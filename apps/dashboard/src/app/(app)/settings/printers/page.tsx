'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../../components/layout/Header';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';
import api from '../../../../lib/api';
import { Printer, Plus, Wifi, WifiOff, Trash2 } from 'lucide-react';

export default function PrintersPage() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'usb', connectionString: '', paperWidth: 80, printOnNewOrder: true, printOnReady: false });

  useEffect(() => { loadPrinters(); }, []);

  const loadPrinters = async () => {
    setLoading(true);
    const { data } = await api.get('/printers');
    setPrinters(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    await api.post('/printers', form);
    setShowModal(false);
    setForm({ name: '', type: 'usb', connectionString: '', paperWidth: 80, printOnNewOrder: true, printOnReady: false });
    loadPrinters();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover impressora?')) return;
    await api.delete(`/printers/${id}`);
    loadPrinters();
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Impressoras" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Instale o <a href="#" className="text-[#FF6B00] hover:underline">ZappAI Print Agent</a> para impressão automática.
          </div>
          <Button onClick={() => setShowModal(true)}><Plus size={14} />Adicionar Impressora</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {printers.map((printer) => (
            <div key={printer.id} className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2d2d4f] rounded-xl flex items-center justify-center">
                    <Printer size={20} className="text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{printer.name}</h3>
                    <p className="text-xs text-gray-500">{printer.type.toUpperCase()} • {printer.paperWidth}mm</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(printer.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {printer.isOnline ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <Wifi size={12} />
                    Online {printer.agentVersion && `(v${printer.agentVersion})`}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <WifiOff size={12} />
                    Offline
                  </div>
                )}
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                {printer.printOnNewOrder && <p>• Imprime em novos pedidos</p>}
                {printer.printOnReady && <p>• Imprime quando pronto</p>}
              </div>
            </div>
          ))}
          {!loading && printers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Printer size={40} className="mx-auto mb-3 text-gray-600" />
              <p>Nenhuma impressora configurada</p>
            </div>
          )}
        </div>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Adicionar Impressora">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Impressora Cozinha" required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Tipo</label>
              <select className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="usb">USB</option>
                <option value="network">Rede (IP)</option>
                <option value="serial">Serial</option>
                <option value="bluetooth">Bluetooth</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Largura do papel</label>
              <select className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none" value={form.paperWidth} onChange={(e) => setForm((f) => ({ ...f, paperWidth: Number(e.target.value) }))}>
                <option value={58}>58mm</option>
                <option value={80}>80mm</option>
              </select>
            </div>
          </div>
          {form.type === 'network' && (
            <Input label="Endereço IP:Porta" value={form.connectionString} onChange={(e) => setForm((f) => ({ ...f, connectionString: e.target.value }))} placeholder="192.168.1.100:9100" />
          )}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.printOnNewOrder} onChange={(e) => setForm((f) => ({ ...f, printOnNewOrder: e.target.checked }))} className="accent-[#FF6B00]" />
              <span className="text-sm text-gray-300">Imprimir ao receber novo pedido</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.printOnReady} onChange={(e) => setForm((f) => ({ ...f, printOnReady: e.target.checked }))} className="accent-[#FF6B00]" />
              <span className="text-sm text-gray-300">Imprimir quando pedido estiver pronto</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} className="flex-1">Adicionar</Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
