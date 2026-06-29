'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import api from '../../../lib/api';
import { AlertTriangle, Plus, Package } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function StockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'IN', quantity: 1, reason: '' });

  useEffect(() => { loadStock(); }, []);

  const loadStock = async () => {
    setLoading(true);
    const [stockRes, movRes] = await Promise.all([
      api.get('/stock'),
      api.get('/stock/movements'),
    ]);
    setStock(stockRes.data);
    setMovements(movRes.data);
    setLoading(false);
  };

  const handleRegisterMovement = async () => {
    await api.post('/stock/movements', form);
    setShowModal(false);
    setForm({ productId: '', type: 'IN', quantity: 1, reason: '' });
    loadStock();
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Estoque" subtitle="Controle de inventário" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowModal(true)}><Plus size={14} />Registrar Movimento</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock levels */}
          <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Níveis de Estoque</h3>
            {stock.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={32} className="mx-auto mb-2 text-gray-600" />
                <p>Nenhum produto com controle de estoque</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stock.map((product) => {
                  const isLow = product.stockQuantity <= product.stockMinimum;
                  return (
                    <div key={product.id} className={cn('flex items-center gap-3 p-3 rounded-lg', isLow ? 'bg-red-500/5 border border-red-500/20' : 'bg-[#0f0f1a]')}>
                      {isLow && <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn('font-bold text-sm', isLow ? 'text-red-400' : 'text-white')}>
                          {product.stockQuantity}
                        </span>
                        <span className="text-xs text-gray-600 ml-1">/ {product.stockMinimum} mín.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent movements */}
          <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Movimentos Recentes</h3>
            <div className="space-y-2">
              {movements.slice(0, 15).map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 py-2 border-b border-[#2d2d4f] last:border-0">
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', {
                    'bg-green-500/20 text-green-400': mov.type === 'IN',
                    'bg-red-500/20 text-red-400': ['OUT', 'LOSS'].includes(mov.type),
                    'bg-blue-500/20 text-blue-400': mov.type === 'ADJUSTMENT',
                  })}>
                    {mov.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{mov.product?.name}</p>
                    {mov.reason && <p className="text-xs text-gray-600 truncate">{mov.reason}</p>}
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-white">{mov.previousQty} → {mov.newQty}</p>
                    <p className="text-gray-600">{new Date(mov.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
              {movements.length === 0 && (
                <p className="text-center py-8 text-gray-500 text-sm">Nenhum movimento registrado</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Movimento">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Produto</label>
            <select
              className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none"
              value={form.productId}
              onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
            >
              <option value="">Selecione um produto...</option>
              {stock.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (atual: {p.stockQuantity})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Tipo</label>
              <select className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="IN">Entrada</option>
                <option value="OUT">Saída</option>
                <option value="ADJUSTMENT">Ajuste</option>
                <option value="LOSS">Perda</option>
              </select>
            </div>
            <Input label="Quantidade" type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
          </div>
          <Input label="Motivo" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Descrição opcional" />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleRegisterMovement} className="flex-1">Registrar</Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
