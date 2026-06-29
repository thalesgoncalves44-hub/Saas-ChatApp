'use client';
import { useState, useRef } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomersImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [status, setStatus] = useState<'idle' | 'preview' | 'importing' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = text.trim().split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      setPreview(rows.slice(0, 6));
      setStatus('preview');
    };
    reader.readAsText(file);
  };

  const doImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setStatus('importing');
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await api.post('/customers/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message ?? 'Erro na importação');
      setStatus('error');
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Importar Clientes</h1>
        <p className="text-gray-400 mt-1">Importe sua base de clientes via planilha CSV</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Formato esperado do CSV</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
            nome,telefone,email<br/>
            João Silva,(11) 99999-1111,joao@email.com<br/>
            Maria Santos,(11) 88888-2222,
          </div>
          <p className="text-xs text-gray-500 mt-3">• Colunas obrigatórias: <strong>nome</strong> e <strong>telefone</strong></p>
          <p className="text-xs text-gray-500">• Clientes com telefone já cadastrado serão atualizados</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {status === 'idle' || status === 'preview' ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-orange-500 transition-colors"
            >
              <div className="text-4xl mb-3">📂</div>
              <p className="text-gray-300 font-medium">Clique para selecionar o arquivo CSV</p>
              <p className="text-gray-500 text-sm mt-1">ou arraste e solte aqui</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          ) : null}

          {status === 'preview' && preview.length > 0 && (
            <div className="mt-5">
              <p className="text-sm text-gray-400 mb-3">Pré-visualização (primeiras 5 linhas):</p>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800">
                      {preview[0].map((h, i) => <th key={i} className="px-3 py-2 text-left text-gray-400 font-semibold text-xs uppercase">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-t border-gray-700">
                        {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-gray-300">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={doImport} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg transition-colors">
                  Confirmar e importar
                </button>
                <button onClick={() => { setStatus('idle'); setPreview([]); if (fileRef.current) fileRef.current.value = ''; }}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-2.5 rounded-lg transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {status === 'importing' && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Importando clientes...</p>
            </div>
          )}

          {status === 'done' && result && (
            <div className="text-center py-8">
              <div className="text-green-400 text-5xl mb-4">✓</div>
              <p className="text-xl font-bold text-white">{result.imported} clientes importados</p>
              {result.errors > 0 && <p className="text-yellow-400 text-sm mt-2">{result.errors} linhas ignoradas (dados inválidos)</p>}
              <button onClick={() => setStatus('idle')} className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold">
                Importar outro arquivo
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="text-red-400 text-5xl mb-4">✗</div>
              <p className="text-red-400 font-semibold">{errorMsg}</p>
              <button onClick={() => setStatus('idle')} className="mt-6 bg-gray-700 text-gray-300 px-6 py-2 rounded-lg">
                Tentar novamente
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
