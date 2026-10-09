import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  Download,
  FileDown,
  FileSpreadsheet,
  Pencil,
  Check,
  X,
  Save,
} from 'lucide-react';
import { MaterialItem, SupplierType } from '../types';
import {
  downloadMaterialPdf,
  createMaterialPdfDocument,
  triggerPdfPrint,
} from '../utils/pdfGenerator';
import { downloadInventoryExcel } from '../utils/excelGenerator';
import { formatBrazilianDate } from './PalletMask';

interface MaterialMaskProps {
  items: MaterialItem[];
  onAddItem: (item: Omit<MaterialItem, 'id'>) => Promise<void>;
  onUpdateItem: (item: MaterialItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  isAuthenticated: boolean;
  onSaveToHistory: (title: string, supplier: SupplierType) => Promise<void>;
}

function chunkIntoPages<T>(arr: T[], pageSize: number): T[][] {
  if (arr.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += pageSize) {
    pages.push(arr.slice(i, i + pageSize));
  }
  return pages;
}

export const MaterialMask: React.FC<MaterialMaskProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onClearAll,
  isAuthenticated,
  onSaveToHistory,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  // Estado do formulário único de inserção
  const [pedido, setPedido] = useState('');
  const [lm, setLm] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [palete, setPalete] = useState('');
  const [dataIso, setDataIso] = useState(todayIso);
  const [formError, setFormError] = useState('');

  // Estado para salvar no histórico da nuvem
  const [batchTitle, setBatchTitle] = useState('');
  const [batchSupplier, setBatchSupplier] = useState<SupplierType>('LEROY MERLIN');
  const [savingBatch, setSavingBatch] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Estado opcional de edição rápida de um item da lista
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPedido, setEditPedido] = useState('');
  const [editLm, setEditLm] = useState('');
  const [editQuantidade, setEditQuantidade] = useState('');
  const [editPalete, setEditPalete] = useState('');
  const [editDataInventario, setEditDataInventario] = useState('');

  const pedidoInputRef = useRef<HTMLInputElement>(null);

  const pages = chunkIntoPages(items, 6);
  const totalPages = pages.length;
  const [selectedPageIdx, setSelectedPageIdx] = useState<number>(0);
  const activePageIdx = Math.min(selectedPageIdx, Math.max(0, totalPages - 1));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido.trim() && !lm.trim() && !quantidade.trim()) {
      setFormError(
        'Preencha pelo menos um dos campos (Pedido, LM ou Quantidade).'
      );
      return;
    }
    setFormError('');

    const formattedInventoryDate = formatBrazilianDate(dataIso || todayIso);

    await onAddItem({
      pedido: pedido.trim().slice(0, 100),
      lm: lm.trim().slice(0, 100),
      quantidade: quantidade.trim().slice(0, 50),
      palete: palete.trim().slice(0, 50),
      dataInventario: formattedInventoryDate,
      batchId: 'active',
    });

    setPedido('');
    setLm('');
    setQuantidade('');
    setPalete('');
    pedidoInputRef.current?.focus();
  };

  const handleRemoveItem = async (id: string) => {
    await onDeleteItem(id);
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleClearAllClick = async () => {
    await onClearAll();
    setEditingId(null);
    setSelectedPageIdx(0);
  };

  const startEditing = (item: MaterialItem) => {
    setEditingId(item.id);
    setEditPedido(item.pedido);
    setEditLm(item.lm);
    setEditQuantidade(item.quantidade);
    setEditPalete(item.palete || '');
    setEditDataInventario(
      item.dataInventario || formatBrazilianDate(todayIso)
    );
  };

  const saveEditing = async (item: MaterialItem) => {
    await onUpdateItem({
      ...item,
      pedido: editPedido.trim().slice(0, 100),
      lm: editLm.trim().slice(0, 100),
      quantidade: editQuantidade.trim().slice(0, 50),
      palete: editPalete.trim().slice(0, 50),
      dataInventario:
        editDataInventario.trim().slice(0, 40) ||
        formatBrazilianDate(todayIso),
    });
    setEditingId(null);
  };

  const handleSaveBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSavingBatch(true);
    setSaveSuccessMsg('');
    try {
      const defaultTitle =
        batchTitle.trim() ||
        `Inventário ${batchSupplier} - ${formatBrazilianDate(todayIso)}`;
      await onSaveToHistory(defaultTitle.slice(0, 120), batchSupplier);
      setBatchTitle('');
      setSaveSuccessMsg('Inventário salvo no histórico da nuvem com sucesso!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDownloadAll = () => {
    downloadMaterialPdf(items);
  };

  const handleDownloadSinglePage = (pageIndex: number) => {
    downloadMaterialPdf(items, pageIndex);
  };

  const handlePrintAll = () => {
    const doc = createMaterialPdfDocument(items);
    triggerPdfPrint(doc);
  };

  const handlePrintSinglePage = (pageIndex: number) => {
    const doc = createMaterialPdfDocument(items, pageIndex);
    triggerPdfPrint(doc);
  };

  const handleDownloadExcel = () => {
    downloadInventoryExcel(items);
  };

  return (
    <div className="w-full">
      {/* Painel Principal: Formulário Único + Lista de Materiais Adicionados */}
      <section className="no-print max-w-[1122px] mx-auto mb-8 bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        {/* Cabeçalho e Botões Gerais de Download / Impressão / Excel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Máscara de Material (Padrão Oficial 6 Quadros por Folha)
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Adicione os materiais no formulário abaixo. Eles ficam sincronizados e podem ser exportados em PDF ou Excel com data e número do palete.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="px-4 py-2.5 text-sm font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Baixar Todas ({totalPages} {totalPages === 1 ? 'Folha' : 'Folhas'} PDF)
            </button>
            <button
              type="button"
              onClick={handlePrintAll}
              className="px-4 py-2.5 text-sm font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Todas ({totalPages})
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={items.length === 0}
              className="px-4 py-2.5 text-sm font-bold text-[#F5C400] bg-neutral-900 hover:bg-black border border-black disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Baixar Inventário (Excel)
            </button>
          </div>
        </div>

        {/* 1. OPÇÃO ÚNICA DE ENTRADA DE INFORMAÇÕES */}
        <form
          onSubmit={handleAddSubmit}
          className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Adicionar Material
            </span>
            <span className="text-xs text-neutral-500">
              * Os campos <strong>Nº do Palete</strong> e <strong>Data do Inventário</strong> vão para a planilha Excel (não alteram a etiqueta impressa).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label
                htmlFor="input-pedido"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Pedido
              </label>
              <input
                ref={pedidoInputRef}
                id="input-pedido"
                type="text"
                placeholder="Nº do Pedido"
                value={pedido}
                onChange={(e) => {
                  setPedido(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full h-11 px-3 py-2 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="input-lm"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                LM
              </label>
              <input
                id="input-lm"
                type="text"
                placeholder="Código LM"
                value={lm}
                onChange={(e) => {
                  setLm(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full h-11 px-3 py-2 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="input-quantidade"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Quantidade
              </label>
              <input
                id="input-quantidade"
                type="text"
                placeholder="Quantidade"
                value={quantidade}
                onChange={(e) => {
                  setQuantidade(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full h-11 px-3 py-2 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="input-palete"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Nº do Palete (Excel)
              </label>
              <input
                id="input-palete"
                type="text"
                placeholder="Ex: 1"
                value={palete}
                onChange={(e) => {
                  setPalete(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full h-11 px-3 py-2 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="input-data-inv"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
              >
                Data Inventário
              </label>
              <input
                id="input-data-inv"
                type="date"
                value={dataIso}
                onChange={(e) => setDataIso(e.target.value)}
                className="w-full h-11 px-2.5 py-2 text-xs font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full h-11 px-4 text-sm font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Adicionar Material
              </button>
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-red-600 mt-2.5">
              {formError}
            </p>
          )}
        </form>

        {/* 2. LISTA DE TODOS OS MATERIAIS ADICIONADOS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
              Lista de Materiais Adicionados ({items.length})
            </h2>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllClick}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar toda a lista
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="border border-dashed border-neutral-300 rounded-xl py-8 px-4 text-center bg-neutral-50/50">
              <p className="text-sm font-medium text-neutral-600">
                Nenhum material adicionado na lista.
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Preencha <strong>Pedido</strong>, <strong>LM</strong>, <strong>Quantidade</strong> e <strong>Nº do Palete</strong> acima e clique em <strong>Adicionar Material</strong>.
              </p>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white border-b border-black text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-12 text-[#F5C400]">#</th>
                      <th className="py-2.5 px-4">Pedido</th>
                      <th className="py-2.5 px-4">LM</th>
                      <th className="py-2.5 px-4">Quantidade</th>
                      <th className="py-2.5 px-4 text-[#F5C400]">Nº do Palete (Excel)</th>
                      <th className="py-2.5 px-4 text-[#F5C400]">Data Inventário (Excel)</th>
                      <th className="py-2.5 px-4">Local na Folha</th>
                      <th className="py-2.5 px-4 text-right w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-sm">
                    {items.map((item, idx) => {
                      const pageNum = Math.floor(idx / 6) + 1;
                      const posInPage = (idx % 6) + 1;
                      const isEditing = editingId === item.id;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-neutral-50 transition-colors tabular-nums"
                        >
                          <td className="py-2.5 px-4 font-bold text-neutral-500">
                            {idx + 1}
                          </td>

                          <td className="py-2.5 px-4 font-bold text-neutral-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPedido}
                                onChange={(e) => setEditPedido(e.target.value)}
                                className="w-full max-w-[130px] px-2.5 py-1 text-sm font-bold border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
                              />
                            ) : (
                              item.pedido || '—'
                            )}
                          </td>

                          <td className="py-2.5 px-4 font-bold text-neutral-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editLm}
                                onChange={(e) => setEditLm(e.target.value)}
                                className="w-full max-w-[130px] px-2.5 py-1 text-sm font-bold border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
                              />
                            ) : (
                              item.lm || '—'
                            )}
                          </td>

                          <td className="py-2.5 px-4 font-bold text-neutral-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editQuantidade}
                                onChange={(e) =>
                                  setEditQuantidade(e.target.value)
                                }
                                className="w-full max-w-[90px] px-2.5 py-1 text-sm font-bold border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
                              />
                            ) : (
                              item.quantidade || '—'
                            )}
                          </td>

                          <td className="py-2.5 px-4 font-extrabold text-neutral-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPalete}
                                onChange={(e) => setEditPalete(e.target.value)}
                                className="w-full max-w-[80px] px-2.5 py-1 text-sm font-bold border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
                              />
                            ) : (
                              item.palete || '—'
                            )}
                          </td>

                          <td className="py-2.5 px-4 font-semibold text-neutral-700">
                            {isEditing ? (
                              <input
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={editDataInventario}
                                onChange={(e) =>
                                  setEditDataInventario(e.target.value)
                                }
                                className="w-full max-w-[110px] px-2.5 py-1 text-sm font-bold border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
                              />
                            ) : (
                              item.dataInventario ||
                              formatBrazilianDate(todayIso)
                            )}
                          </td>

                          <td className="py-2.5 px-4 text-xs text-neutral-500">
                            Folha {pageNum} · Quadro {posInPage} de 6
                          </td>

                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => saveEditing(item)}
                                    title="Salvar"
                                    className="p-1.5 text-black bg-[#F5C400] hover:bg-[#E0B200] rounded transition-colors cursor-pointer"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    title="Cancelar"
                                    className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditing(item)}
                                    title="Editar material"
                                    className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    title="Excluir da lista"
                                    className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Barra para Salvar no Histórico de Inventários (Firebase) */}
        {isAuthenticated && items.length > 0 && (
          <form
            onSubmit={handleSaveBatchSubmit}
            className="mt-5 p-4 bg-neutral-900 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F5C400] whitespace-nowrap">
                Guardar no Histórico:
              </span>
              <input
                type="text"
                placeholder="Nome do lote (ex: Devolução Leroy Lote 01)"
                value={batchTitle}
                onChange={(e) => setBatchTitle(e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-bold text-neutral-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
              />
              <select
                value={batchSupplier}
                onChange={(e) =>
                  setBatchSupplier(e.target.value as SupplierType)
                }
                className="h-9 px-3 text-xs font-bold text-neutral-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400]"
              >
                <option value="LEROY MERLIN">LEROY MERLIN</option>
                <option value="TELHANORTE">TELHANORTE</option>
              </select>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {saveSuccessMsg && (
                <span className="text-xs font-bold text-[#F5C400]">
                  {saveSuccessMsg}
                </span>
              )}
              <button
                type="submit"
                disabled={savingBatch}
                className="px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-black bg-[#F5C400] hover:bg-[#E0B200] disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {savingBatch ? 'Salvando...' : 'Salvar Lote no Histórico'}
              </button>
            </div>
          </form>
        )}

        {/* Barra de Ação para Baixar ou Imprimir 1 Folha Específica */}
        <div className="mt-6 pt-5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200/80">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="single-material-page-select"
              className="text-xs font-bold uppercase tracking-wider text-neutral-700 whitespace-nowrap"
            >
              Baixar ou Imprimir 1 Folha Específica:
            </label>
            <select
              id="single-material-page-select"
              value={activePageIdx}
              onChange={(e) => setSelectedPageIdx(Number(e.target.value))}
              className="h-10 px-3 py-1.5 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
            >
              {pages.map((p, idx) => (
                <option key={idx} value={idx}>
                  Folha {idx + 1} de {totalPages} ({p.length}{' '}
                  {p.length === 1 ? 'material preenchido' : 'materiais preenchidos'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleDownloadSinglePage(activePageIdx)}
              className="px-3.5 py-2 text-xs font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Baixar Só Folha {activePageIdx + 1} (PDF)
            </button>
            <button
              type="button"
              onClick={() => handlePrintSinglePage(activePageIdx)}
              className="px-3.5 py-2 text-xs font-bold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Só Folha {activePageIdx + 1}
            </button>
          </div>
        </div>
      </section>

      {/* Área de Pré-visualização Única na Tela (Sem lista extensa de páginas) */}
      <div className="print-container">
        {(() => {
          const pageItems = pages[activePageIdx] || [];
          const sixSlots = Array.from({ length: 6 }, (_, i) => pageItems[i]);

          return (
            <div className="mb-10 print:mb-0">
              <div className="no-print max-w-[1122px] mx-auto mb-2.5 flex items-center justify-between px-1">
                <span className="text-xs font-bold text-neutral-600 tabular-nums">
                  Pré-visualização da Máscara · Exibindo Folha {activePageIdx + 1} de {totalPages} ({pageItems.length} de 6 quadros preenchidos)
                </span>
                <span className="text-xs text-neutral-500">
                  Use o seletor acima para alternar entre folhas ou baixar/imprimir uma folha específica
                </span>
              </div>

              {/* Única Folha A4 Paisagem exibida na tela */}
              <div
                className="a4-sheet-landscape"
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
              >
                {/* Posicionamento percentual exato medido da folha oficial 297mm x 210mm */}
                <div className="w-full h-full relative bg-white text-black select-none">
                  {sixSlots.map((block, slotIdx) => {
                    const col = slotIdx % 2;
                    const row = Math.floor(slotIdx / 2);

                    const leftPct = col === 0 ? '6.56%' : '49.16%';
                    const topPct =
                      row === 0 ? '10.10%' : row === 1 ? '37.62%' : '60.48%';

                    return (
                      <div
                        key={block?.id || `empty-slot-${slotIdx}`}
                        style={{
                          position: 'absolute',
                          left: leftPct,
                          top: topPct,
                          width: '39.73%',
                          height: '20.57%',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                        }}
                        className="border-[2.2px] border-black print-border-black grid grid-rows-4 bg-white overflow-hidden"
                      >
                        {/* Linha 1: Cabeçalho Escuro (#1C1C1C) com DEVOLUÇÃO em branco */}
                        <div
                          className="border-b-[1.5px] border-black print-border-black flex items-center justify-center text-center"
                          style={{ backgroundColor: '#1C1C1C' }}
                        >
                          <span className="font-bold uppercase text-white tracking-normal leading-none text-[15px] sm:text-[18px] md:text-[20px]">
                            DEVOLUÇÃO
                          </span>
                        </div>

                        {/* Linha 2: PEDIDO (fundo cinza #F2F2F2 à esquerda | valor em branco à direita) */}
                        <div className="border-b-[1.5px] border-black print-border-black grid grid-cols-[29.8%_70.2%] items-stretch">
                          <div
                            className="border-r-[1.5px] border-black print-border-black flex items-center justify-center px-1 text-center overflow-hidden"
                            style={{ backgroundColor: '#F2F2F2' }}
                          >
                            <span
                              className="font-bold uppercase text-black leading-none whitespace-nowrap"
                              style={{ fontSize: 'clamp(10px, 1.28vw, 14px)' }}
                            >
                              PEDIDO
                            </span>
                          </div>
                          <div className="bg-white flex items-center justify-center px-2 text-center overflow-hidden">
                            <span className="font-bold text-black leading-none tabular-nums truncate text-[14px] sm:text-[18px] md:text-[21px]">
                              {block?.pedido || ''}
                            </span>
                          </div>
                        </div>

                        {/* Linha 3: LM (fundo cinza #F2F2F2 à esquerda | valor em branco à direita) */}
                        <div className="border-b-[1.5px] border-black print-border-black grid grid-cols-[29.8%_70.2%] items-stretch">
                          <div
                            className="border-r-[1.5px] border-black print-border-black flex items-center justify-center px-1 text-center overflow-hidden"
                            style={{ backgroundColor: '#F2F2F2' }}
                          >
                            <span
                              className="font-bold uppercase text-black leading-none whitespace-nowrap"
                              style={{ fontSize: 'clamp(10px, 1.28vw, 14px)' }}
                            >
                              LM
                            </span>
                          </div>
                          <div className="bg-white flex items-center justify-center px-2 text-center overflow-hidden">
                            <span className="font-bold text-black leading-none tabular-nums truncate text-[14px] sm:text-[18px] md:text-[21px]">
                              {block?.lm || ''}
                            </span>
                          </div>
                        </div>

                        {/* Linha 4: QUANTIDADE (fundo cinza #F2F2F2 à esquerda | valor em branco à direita) */}
                        <div className="grid grid-cols-[29.8%_70.2%] items-stretch">
                          <div
                            className="border-r-[1.5px] border-black print-border-black flex items-center justify-center px-1 text-center overflow-hidden"
                            style={{ backgroundColor: '#F2F2F2' }}
                          >
                            <span
                              className="font-bold uppercase text-black leading-none whitespace-nowrap"
                              style={{ fontSize: 'clamp(9.5px, 1.18vw, 13px)' }}
                            >
                              QUANTIDADE
                            </span>
                          </div>
                          <div className="bg-white flex items-center justify-center px-2 text-center overflow-hidden">
                            <span className="font-bold text-black leading-none tabular-nums truncate text-[14px] sm:text-[18px] md:text-[21px]">
                              {block?.quantidade || ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
