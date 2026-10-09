import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  FolderOpen,
  Calendar,
  Building2,
  Package,
  ChevronDown,
  ChevronUp,
  LogIn,
} from 'lucide-react';
import { InventoryBatchRecord, MaterialItem } from '../types';
import { downloadInventoryExcel } from '../utils/excelGenerator';
import { downloadMaterialPdf } from '../utils/pdfGenerator';

interface InventoryHistoryProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  batches: InventoryBatchRecord[];
  batchItemsMap: Record<string, MaterialItem[]>;
  onLoadBatchIntoWorkspace: (batch: InventoryBatchRecord, items: MaterialItem[]) => void;
  onDeleteBatch: (batchId: string) => Promise<void>;
}

export const InventoryHistory: React.FC<InventoryHistoryProps> = ({
  isAuthenticated,
  onLogin,
  batches,
  batchItemsMap,
  onLoadBatchIntoWorkspace,
  onDeleteBatch,
}) => {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(
    batches[0]?.id || null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <section className="max-w-[1122px] mx-auto bg-white border border-neutral-200 rounded-xl p-10 text-center shadow-xs">
        <div className="max-w-md mx-auto flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-black text-[#F5C400] flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">
            Conecte sua Conta para Sincronizar seu Histórico
          </h1>
          <p className="text-sm text-neutral-600">
            Faça login com sua conta Google para salvar e acessar seus inventários e etiquetas de qualquer computador ou celular em tempo real via Firebase.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="mt-2 px-6 py-3 text-sm font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            Entrar com Google para Sincronizar
          </button>
        </div>
      </section>
    );
  }

  const handleDelete = async (batchId: string) => {
    setDeletingId(batchId);
    try {
      await onDeleteBatch(batchId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="max-w-[1122px] mx-auto bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Histórico de Inventários Salvos na Nuvem
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Todos os lotes salvos ficam sincronizados no Firebase para consulta, reimpressão de etiquetas ou download em Excel de qualquer dispositivo.
          </p>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 tabular-nums">
          Total de Lotes Salvos: <strong className="text-neutral-900">{batches.length}</strong>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-xl py-12 px-4 text-center bg-neutral-50/60">
          <p className="text-sm font-bold text-neutral-700">
            Nenhum lote de inventário salvo no histórico ainda.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Na aba <strong>2. Máscara de Material</strong>, adicione seus materiais e clique em <strong>Salvar no Histórico</strong> para guardá-los na nuvem.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => {
            const bItems = batchItemsMap[batch.id] || [];
            const isExpanded = expandedBatchId === batch.id;

            return (
              <div
                key={batch.id}
                className="border border-neutral-200 rounded-xl overflow-hidden bg-white transition-colors"
              >
                {/* Cabeçalho do Lote */}
                <div className="p-4 bg-neutral-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-extrabold text-neutral-900">
                        {batch.title}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#D4A900]" />
                        {batch.supplier}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-xs font-semibold text-neutral-600 flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {batch.batchDate}
                      </span>
                      <span className="text-neutral-400">·</span>
                      <span className="text-xs font-bold text-neutral-800 tabular-nums">
                        {bItems.length} {bItems.length === 1 ? 'material' : 'materiais'}
                      </span>
                    </div>
                  </div>

                  {/* Ações do Lote */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        downloadInventoryExcel(
                          bItems,
                          `${batch.title} (${batch.batchDate})`
                        )
                      }
                      disabled={bItems.length === 0}
                      className="px-3 py-2 text-xs font-bold text-[#F5C400] bg-neutral-900 hover:bg-black disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Baixar Excel
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadMaterialPdf(bItems)}
                      disabled={bItems.length === 0}
                      className="px-3 py-2 text-xs font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar Etiquetas PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadBatchIntoWorkspace(batch, bItems)}
                      className="px-3 py-2 text-xs font-bold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Abrir na Máscara
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(batch.id)}
                      disabled={deletingId === batch.id}
                      title="Excluir este inventário do histórico"
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBatchId(isExpanded ? null : batch.id)
                      }
                      className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer"
                      aria-label="Expandir itens"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabela de Itens do Lote */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black text-white text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-2 px-4 w-12 text-[#F5C400]">#</th>
                          <th className="py-2 px-4">Pedido</th>
                          <th className="py-2 px-4">LM</th>
                          <th className="py-2 px-4">Quantidade</th>
                          <th className="py-2 px-4 text-[#F5C400]">Palete</th>
                          <th className="py-2 px-4">Data do Inventário</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 text-xs tabular-nums">
                        {bItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-neutral-50">
                            <td className="py-2 px-4 font-bold text-neutral-500">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-4 font-bold text-neutral-900">
                              {item.pedido || '—'}
                            </td>
                            <td className="py-2 px-4 font-bold text-neutral-900">
                              {item.lm || '—'}
                            </td>
                            <td className="py-2 px-4 font-bold text-neutral-900">
                              {item.quantidade || '—'}
                            </td>
                            <td className="py-2 px-4 font-extrabold text-neutral-900">
                              {item.palete || '—'}
                            </td>
                            <td className="py-2 px-4 font-semibold text-neutral-600">
                              {item.dataInventario || batch.batchDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
