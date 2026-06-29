'use client';
import React, { useEffect, useState } from 'react';
import { Header } from '../../../components/layout/Header';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import { Badge } from '../../../components/ui/badge';
import { formatCurrency, formatDate } from '../../../lib/utils';
import api from '../../../lib/api';
import { Plus, Trash2, Tag } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage',
    discountValue: 10, minimumOrder: 0, maxUses: '', validUntil: '',
  });

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    setLoading(true);
    const { data } = await api.get('/coupons');
    setCoupons(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    await api.post('/coupons', { ...form, maxUses: form.maxUses ? Number(form.maxUses) : null });
    setShowModal(false);
    setForm({ code: '', description: '', discountType: 'percentage', discountValue: 10, minimumOrder: 0, maxUses: '', validUntil: '' });
    loadCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir cupom?')) return;
    await api.delete(`/coupons/${id}`);
    loadCoupons();
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Cupons" subtitle="Gerencie descontos e promoções" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowModal(true)}><Plus size={14} />Novo Cupom</Button>
        </div>
        <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d4f]">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Código</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Desconto</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Mín. Pedido</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Usos</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Válido até</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d4f]">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-[#1e1e35]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-[#FF6B00]" />
                      <span className="font-mono font-bold text-white">{coupon.code}</span>
                    </div>
                    {coupon.description && <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#FF6B00] font-semibold">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(Number(coupon.discountValue))}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{formatCurrency(Number(coupon.minimumOrder))}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {coupon.usedCount}/{coupon.maxUses || '∞'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {coupon.validUntil ? formatDate(coupon.validUntil) : 'Sem expiração'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={coupon.isActive ? 'success' : 'error'}>
                      {coupon.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(coupon.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && coupons.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">Nenhum cupom criado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Cupom">
        <div className="space-y-4">
          <Input label="Código" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="DESCONTO10" required />
          <Input label="Descrição" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição do cupom" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Tipo</label>
              <select className="w-full h-10 rounded-lg border border-[#2d2d4f] bg-[#0f0f1a] text-white px-3 text-sm focus:border-[#FF6B00] outline-none" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}>
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <Input label={form.discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'} type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pedido Mínimo (R$)" type="number" value={form.minimumOrder} onChange={(e) => setForm((f) => ({ ...f, minimumOrder: Number(e.target.value) }))} />
            <Input label="Máx. de usos" type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="Ilimitado" />
          </div>
          <Input label="Válido até" type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} className="flex-1">Criar Cupom</Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
