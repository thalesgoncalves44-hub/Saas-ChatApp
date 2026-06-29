'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import api from '../../../lib/api';
import { Plus, QrCode, Users, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const TABLE_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-500/20 border-green-500/30 text-green-400',
  OCCUPIED: 'bg-red-500/20 border-red-500/30 text-red-400',
  RESERVED: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  CLOSED: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  CLOSED: 'Fechada',
};

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', capacity: 4, section: '' });
  const [qrCodeModal, setQrCodeModal] = useState<any>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tables');
      setTables(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    await api.post('/tables', createForm);
    setShowCreateModal(false);
    setCreateForm({ name: '', capacity: 4, section: '' });
    loadTables();
  };

  const handleCloseTable = async (tableId: string) => {
    if (!confirm('Fechar esta mesa?')) return;
    await api.post(`/tables/${tableId}/close`);
    loadTables();
  };

  const handleGenerateQR = async (table: any) => {
    const { data } = await api.post(`/tables/${table.id}/qrcode`);
    setQrCodeModal(data);
  };

  const groupedTables = tables.reduce((acc: any, table) => {
    const section = table.section || 'Sem seção';
    if (!acc[section]) acc[section] = [];
    acc[section].push(table);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-screen">
      <Header title="Mesas" subtitle="Controle de mesas e QR codes" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {Object.entries(TABLE_STATUS_LABELS).map(([status, label]) => {
              const count = tables.filter((t) => t.status === status).length;
              return (
                <div key={status} className={cn('px-3 py-2 rounded-lg border text-xs font-medium', TABLE_STATUS_COLORS[status])}>
                  {label}: {count}
                </div>
              );
            })}
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={14} />
            Nova Mesa
          </Button>
        </div>

        {Object.entries(groupedTables).map(([section, sectionTables]: [string, any]) => (
          <div key={section}>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">{section}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sectionTables.map((table: any) => (
                <div
                  key={table.id}
                  className={cn('bg-[#1a1a2e] border rounded-xl p-4 flex flex-col gap-2 card-hover', TABLE_STATUS_COLORS[table.status])}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-white text-lg">{table.name}</span>
                    {table.status === 'OCCUPIED' && (
                      <button
                        onClick={() => handleCloseTable(table.id)}
                        className="text-red-400 hover:text-red-300 p-0.5"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={12} />
                    {table.capacity} pessoas
                  </div>
                  <div className={cn('text-xs font-medium px-2 py-1 rounded-full text-center', TABLE_STATUS_COLORS[table.status])}>
                    {TABLE_STATUS_LABELS[table.status]}
                  </div>
                  {table.orders?.[0] && (
                    <div className="text-xs text-gray-400 border-t border-[#2d2d4f] pt-2 mt-1">
                      Pedido #{table.orders[0].orderNumber}
                    </div>
                  )}
                  <button
                    onClick={() => handleGenerateQR(table)}
                    className="text-xs text-gray-500 hover:text-[#FF6B00] flex items-center gap-1 transition-colors"
                  >
                    <QrCode size={12} />
                    QR Code
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {tables.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🪑</p>
            <p className="text-lg font-medium">Nenhuma mesa cadastrada</p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              <Plus size={14} />
              Adicionar mesa
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nova Mesa">
        <div className="space-y-4">
          <Input
            label="Nome"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Mesa 1"
            required
          />
          <Input
            label="Capacidade"
            type="number"
            value={createForm.capacity}
            onChange={(e) => setCreateForm((f) => ({ ...f, capacity: parseInt(e.target.value) }))}
          />
          <Input
            label="Seção (opcional)"
            value={createForm.section}
            onChange={(e) => setCreateForm((f) => ({ ...f, section: e.target.value }))}
            placeholder="Salão Principal, Área Externa..."
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreateTable} className="flex-1">Criar Mesa</Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      {qrCodeModal && (
        <Modal open={!!qrCodeModal} onClose={() => setQrCodeModal(null)} title="QR Code da Mesa">
          <div className="text-center">
            {qrCodeModal.qrCodeUrl && (
              <img src={qrCodeModal.qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-4" />
            )}
            <p className="text-xs text-gray-500 break-all">{qrCodeModal.qrCodeData}</p>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                const link = document.createElement('a');
                link.download = `mesa-qr.png`;
                link.href = qrCodeModal.qrCodeUrl;
                link.click();
              }}
            >
              Baixar QR Code
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
