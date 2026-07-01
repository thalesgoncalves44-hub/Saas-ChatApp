'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import api from '../../../../lib/api';
import { MessageCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function WhatsappSettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingInstance, setCreatingInstance] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/whatsapp/status');
      setStatus(data);
      if (!data.connected && data.instance) {
        const qrRes = await api.get('/whatsapp/qrcode');
        setQrCode(qrRes.data.qrcode);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    setCreatingInstance(true);
    try {
      await api.post('/whatsapp/instance');
      await loadStatus();
    } finally {
      setCreatingInstance(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle size={24} className="text-green-400" />
              <h2 className="text-xl font-semibold text-white">WhatsApp Business</h2>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full" />
                Verificando conexão...
              </div>
            ) : status?.connected ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={20} />
                <div>
                  <p className="font-medium">WhatsApp conectado!</p>
                  <p className="text-sm text-gray-400">Instância: {status.instance}</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 text-red-400 mb-4">
                  <XCircle size={20} />
                  <p className="font-medium">WhatsApp desconectado</p>
                </div>
                {qrCode ? (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-4">Escaneie o QR code com seu WhatsApp Business:</p>
                    <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48 mx-auto border-4 border-white rounded" />
                    <Button onClick={loadStatus} variant="outline" size="sm" className="mt-4">
                      <RefreshCw size={14} />
                      Verificar conexão
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleCreateInstance} loading={creatingInstance}>
                    Conectar WhatsApp
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#1a1a2e] border border-[#2d2d4f] rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Bot Automático</h3>
            <p className="text-sm text-gray-400 mb-4">
              O bot responde automaticamente às mensagens dos clientes com informações sobre cardápio, pedidos e status.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-6 h-6 bg-[#FF6B00]/20 text-[#FF6B00] rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Responde sobre cardápio e produtos
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-6 h-6 bg-[#FF6B00]/20 text-[#FF6B00] rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Informa status do último pedido
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-6 h-6 bg-[#FF6B00]/20 text-[#FF6B00] rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Envia confirmações automáticas de pedidos
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
