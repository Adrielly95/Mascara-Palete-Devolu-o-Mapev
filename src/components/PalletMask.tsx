import React, { useState } from 'react';
import {
  Printer,
  Download,
  Calendar,
  Layers,
  Building2,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PalletConfig, SupplierType } from '../types';
import { MapevLogo } from './MapevLogo';
import {
  downloadPalletPdf,
  createPalletPdfDocument,
  triggerPdfPrint,
} from '../utils/pdfGenerator';

interface PalletMaskProps {
  config: PalletConfig;
  onChange: (newConfig: PalletConfig) => void;
}

export function formatBrazilianDate(isoDate: string): string {
  if (!isoDate) return '--/--/----';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export const PalletMask: React.FC<PalletMaskProps> = ({ config, onChange }) => {
  const total = Math.max(1, Math.min(300, Number(config.totalPallets) || 1));
  const [selectedSinglePallet, setSelectedSinglePallet] = useState<number>(1);
  const activePallet = Math.max(1, Math.min(selectedSinglePallet, total));

  const formattedDate = formatBrazilianDate(config.exitDate);

  const handleSupplierChange = (supplier: SupplierType) => {
    onChange({ ...config, supplier });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...config, exitDate: e.target.value });
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const nextTotal = isNaN(val) ? 1 : Math.max(1, Math.min(300, val));
    onChange({
      ...config,
      totalPallets: nextTotal,
    });
    if (selectedSinglePallet > nextTotal) {
      setSelectedSinglePallet(nextTotal);
    }
  };

  const handleSpecificPalletInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setSelectedSinglePallet(1);
    } else {
      setSelectedSinglePallet(Math.max(1, Math.min(total, val)));
    }
  };

  const handleDownloadAll = () => {
    downloadPalletPdf(config);
  };

  const handleDownloadSingle = (palletNumber: number) => {
    downloadPalletPdf(config, palletNumber);
  };

  const handlePrintAll = () => {
    const doc = createPalletPdfDocument(config);
    triggerPdfPrint(doc);
  };

  const handlePrintSingle = (palletNumber: number) => {
    const doc = createPalletPdfDocument(config, palletNumber);
    triggerPdfPrint(doc);
  };

  return (
    <div className="w-full">
      {/* Formulário de Entrada e Ações - Oculto na Impressão */}
      <section className="no-print max-w-[1122px] mx-auto mb-6 bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-neutral-200">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Máscara de Palete (Padrão Oficial MAPEV)
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Configure o fornecedor, data e total de paletes. Imprima ou baixe todas de uma vez ou escolha um número específico abaixo.
            </p>
          </div>

          {/* Botões Principais: Todas as Páginas (1 até Total) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="px-4 py-2.5 text-sm font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Baixar Todas (1 a {total} em PDF)
            </button>

            <button
              type="button"
              onClick={handlePrintAll}
              className="px-4 py-2.5 text-sm font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Todas (1 a {total})
            </button>
          </div>
        </div>

        {/* Campos do Formulário */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Campo 1: Seletor de Fornecedor */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D4A900]" />
              Fornecedor
            </label>
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              {(['LEROY MERLIN', 'TELHANORTE'] as SupplierType[]).map((option) => {
                const isSelected = config.supplier === option;
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border text-sm font-bold cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="supplier"
                      value={option}
                      checked={isSelected}
                      onChange={() => handleSupplierChange(option)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#F5C400]' : 'border-neutral-400'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#F5C400]" />}
                    </span>
                    <span className="truncate">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Campo 2: Data de Saída */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="pallet-exit-date"
              className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4A900]" />
              Data de Saída
            </label>
            <input
              id="pallet-exit-date"
              type="date"
              value={config.exitDate}
              onChange={handleDateChange}
              className="w-full h-[46px] px-3.5 py-2.5 text-sm font-semibold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
            />
            <span className="text-xs text-neutral-500">
              Data impressa: <strong className="text-neutral-800 tabular-nums">{formattedDate}</strong>
            </span>
          </div>

          {/* Campo 3: Quantidade Total de Paletes */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="pallet-total-count"
              className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-[#D4A900]" />
              Quantidade de Paletes (Total)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="pallet-total-count"
                type="number"
                min={1}
                max={300}
                value={config.totalPallets}
                onChange={handleTotalChange}
                className="w-full h-[46px] px-3.5 py-2.5 text-sm font-bold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F5C400] focus:border-black tabular-nums"
              />
              <div className="flex items-center gap-1 shrink-0">
                {[1, 5, 10, 15].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      onChange({ ...config, totalPallets: preset });
                      if (selectedSinglePallet > preset) {
                        setSelectedSinglePallet(preset);
                      }
                    }}
                    className={`h-[46px] px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer tabular-nums ${
                      config.totalPallets === preset
                        ? 'bg-black text-[#F5C400] border-black'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-neutral-500">
              Total configurado: <strong className="text-neutral-800 tabular-nums">{total} {total === 1 ? 'palete' : 'paletes'}</strong>
            </span>
          </div>
        </div>

        {/* Controle de Número Específico (Sem Lista Extensa) */}
        <div className="mt-6 pt-5 border-t border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Palete Específico (Visualizar / Imprimir Só 1):
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSinglePallet(Math.max(1, activePallet - 1))}
                disabled={activePallet <= 1}
                title="Palete anterior"
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-3 h-10">
                <span className="text-xs font-bold text-neutral-500 uppercase">Nº</span>
                <input
                  type="number"
                  min={1}
                  max={total}
                  value={activePallet}
                  onChange={handleSpecificPalletInput}
                  className="w-16 text-center text-sm font-extrabold text-neutral-900 focus:outline-none tabular-nums"
                />
                <span className="text-xs font-bold text-neutral-500 tabular-nums">
                  de {total}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSinglePallet(Math.min(total, activePallet + 1))}
                disabled={activePallet >= total}
                title="Próximo palete"
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleDownloadSingle(activePallet)}
              className="px-4 py-2.5 text-xs font-extrabold text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              <FileDown className="w-4 h-4" />
              Baixar Só Palete {activePallet} de {total} (PDF)
            </button>
            <button
              type="button"
              onClick={() => handlePrintSingle(activePallet)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Só Palete {activePallet} de {total}
            </button>
          </div>
        </div>
      </section>

      {/* Pré-visualização Única na Tela (Sem lista extensa) */}
      <div className="print-container">
        <div className="no-print max-w-[1122px] mx-auto mb-2.5 flex items-center justify-between px-1">
          <span className="text-xs font-bold text-neutral-600 tabular-nums">
            Pré-visualização da Máscara · Exibindo Palete {activePallet} de {total} ({config.supplier})
          </span>
          <span className="text-xs text-neutral-500">
            Use os botões acima para imprimir/baixar apenas este número ou todos de 1 a {total}
          </span>
        </div>

        {/* Única Folha A4 exibida na tela */}
        <div
          className="a4-sheet-landscape"
          style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <div className="w-full h-full relative bg-white text-black select-none">
            {/* 1. Barra Superior Preta: Logo MAPEV à esquerda + DEVOLUÇÃO centralizado */}
            <div
              className="print-black-box bg-black text-white flex items-center px-[2.4%]"
              style={{
                position: 'absolute',
                left: '2.86%',
                top: '8.33%',
                width: '90.40%',
                height: '14.29%',
                backgroundColor: '#000000',
              }}
            >
              <div className="shrink-0 flex items-center justify-center h-[86%] aspect-[260/155]">
                <MapevLogo className="w-full h-full" />
              </div>
              <div className="flex-1 flex items-center justify-center pr-[3%]">
                <span
                  className="font-bold uppercase text-white tracking-normal leading-none"
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 'clamp(32px, 5.8vw, 84px)',
                  }}
                >
                  DEVOLUÇÃO
                </span>
              </div>
            </div>

            {/* 2. Segunda Barra Separada: FORNECEDOR | LEROY MERLIN / TELHANORTE */}
            <div
              className="border-[2.5px] border-black print-border-black flex items-stretch"
              style={{
                position: 'absolute',
                left: '2.86%',
                top: '24.67%',
                width: '90.40%',
                height: '17.24%',
              }}
            >
              <div
                className="w-[33.1%] border-r-[2.5px] border-black print-border-black flex items-center justify-center px-2 text-center"
                style={{ backgroundColor: '#F2F2F2' }}
              >
                <span
                  className="font-bold uppercase text-black leading-none"
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 'clamp(18px, 3vw, 42px)',
                  }}
                >
                  FORNECEDOR
                </span>
              </div>
              <div className="flex-1 bg-white flex items-center justify-center px-4 text-center">
                <span
                  className="font-bold uppercase text-black leading-none"
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 'clamp(24px, 4.3vw, 60px)',
                  }}
                >
                  {config.supplier}
                </span>
              </div>
            </div>

            {/* 3. Terceira Barra Separada: DATA | DD/MM/AAAA */}
            <div
              className="border-[2.5px] border-black print-border-black flex items-stretch"
              style={{
                position: 'absolute',
                left: '2.86%',
                top: '44.00%',
                width: '90.40%',
                height: '15.81%',
              }}
            >
              <div
                className="w-[33.1%] border-r-[2.5px] border-black print-border-black flex items-center justify-center px-2 text-center"
                style={{ backgroundColor: '#F2F2F2' }}
              >
                <span
                  className="font-bold uppercase text-black leading-none"
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 'clamp(18px, 3vw, 43px)',
                  }}
                >
                  DATA
                </span>
              </div>
              <div className="flex-1 bg-white flex items-center justify-center px-4 text-center">
                <span
                  className="font-bold text-black leading-none tabular-nums"
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 'clamp(24px, 4.2vw, 58px)',
                  }}
                >
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* 4. Quarta Barra Separada: PALETE (Fundo Escuro #1C1C1C) | X de Y */}
            <div
              className="border-[2.5px] border-black print-border-black flex items-stretch"
              style={{
                position: 'absolute',
                left: '2.86%',
                top: '62.67%',
                width: '90.40%',
                height: '22.38%',
              }}
            >
              <div
                className="w-[48.2%] border-r-[2.5px] border-black print-border-black flex items-center justify-center px-4 text-center"
                style={{ backgroundColor: '#1C1C1C' }}
              >
                <span
                  className="font-bold uppercase text-white leading-none"
                  style={{
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: 'clamp(24px, 4.2vw, 58px)',
                  }}
                >
                  PALETE
                </span>
              </div>
              <div className="flex-1 bg-white flex items-center justify-center px-4 text-center">
                <div
                  className="flex items-baseline justify-center text-black font-bold leading-none tabular-nums"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
                  <span style={{ fontSize: 'clamp(44px, 8.2vw, 118px)' }}>
                    {activePallet}
                  </span>
                  <span
                    className="mx-3 font-bold"
                    style={{ fontSize: 'clamp(22px, 3.8vw, 52px)' }}
                  >
                    de
                  </span>
                  <span style={{ fontSize: 'clamp(44px, 8.2vw, 118px)' }}>
                    {total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
