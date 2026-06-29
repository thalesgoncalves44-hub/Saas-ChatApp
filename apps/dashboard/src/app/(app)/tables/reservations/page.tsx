'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  date: string;
  status: string;
  notes?: string;
  table?: { number: number };
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-green-900 text-green-300',
  pending: 'bg-yellow-900 text-yellow-300',
  canceled: 'bg-red-900 text-red-300',
  arrived: 'bg-blue-900 text-blue-300',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: 2, date: '', notes: '', tableId: '' });
  const [tables, setTables] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/tables/reservations'), api.get('/tables')])
      .then(([r, t]) => { setReservations(r.data); setTables(t.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/tables/reservations', form);
    setModal(false);
    setForm({ customerName: '', customerPhone: '', partySize: 2, date: '', notes: '', tableId: '' });
    load();
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancelar esta reserva?')) return;
    await api.patch(`/tables/reservations/${id}/cancel`);
    load();
  };

  const fmt = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="text-gray-400 mt-1">Gerencie as reservas de mesa</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl">
          + Nova reserva
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Carregando...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-lg">Nenhuma reserva encontrada</p>
          <button onClick={() => setModal(true)} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium">
            Criar primeira reserva
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="bg-orange-500/10 rounded-xl p-3 text-center min-w-[64px]">
                  <div className="text-orange-400 font-bold text-lg">{new Date(r.date).getDate()}</div>
                  <div className="text-orange-400 text-xs">{new Date(r.date).toLocaleString('pt-BR', { month: 'short' })}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{r.customerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-700 text-gray-300'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    📞 {r.customerPhone} · 👥 {r.partySize} pessoas · 🕐 {fmt(r.date)}
                    {r.table && ` · Mesa ${r.table.number}`}
                  </div>
                  {r.notes && <div className="text-xs text-gray-500 mt-1">📝 {r.notes}</div>}
                </div>
                {r.status !== 'canceled' && (
                  <button onClick={() => cancel(r.id)} className="text-sm text-red-400 hover:text-red-300 font-medium">
                    Cancelar
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800">
            <h2 className="text-lg font-bold text-white mb-4">Nova Reserva</h2>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Nome do cliente *</label>
                <input required value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Telefone *</label>
                <input required value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Pessoas</label>
                  <input type="number" min={1} max={20} value={form.partySize} onChange={e => setForm(p => ({ ...p, partySize: +e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Mesa</label>
                  <select value={form.tableId} onChange={e => setForm(p => ({ ...p, tableId: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Qualquer</option>
                    {tables.map((t: any) => <option key={t.id} value={t.id}>Mesa {t.number}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Data e horário *</label>
                <input type="datetime-local" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Observações</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg">Criar reserva</button>
                <button type="button" onClick={() => setModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
