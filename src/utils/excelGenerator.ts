import ExcelJS from 'exceljs';
import { MaterialItem } from '../types';

/**
 * Gera e faz o download de um arquivo Excel (.xlsx) profissionalmente formatado
 * com cabeçalho escuro, bordas de tabela, filtro automático, Palete e Data do Inventário em cada linha.
 */
export async function downloadInventoryExcel(
  items: MaterialItem[],
  customTitle?: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MAPEV Soluções Logísticas';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Inventário de Materiais', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Configuração de largura das colunas (6 colunas incluindo DATA DO INVENTÁRIO)
  sheet.columns = [
    { key: 'index', width: 10 },
    { key: 'pedido', width: 22 },
    { key: 'lm', width: 22 },
    { key: 'quantidade', width: 18 },
    { key: 'palete', width: 16 },
    { key: 'dataInventario', width: 24 },
  ];

  // Linha 1: Título Institucional Escuro
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  const todayFormatted = new Date().toLocaleDateString('pt-BR');
  titleCell.value = customTitle
    ? `MAPEV SOLUÇÕES LOGÍSTICAS — ${customTitle.toUpperCase()}`
    : `MAPEV SOLUÇÕES LOGÍSTICAS — INVENTÁRIO DE MATERIAIS (${todayFormatted})`;
  titleCell.font = {
    name: 'Arial',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF111827' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 30;

  // Linha 2: Espaçamento limpo
  sheet.getRow(2).height = 10;

  // Linha 3: Cabeçalho da Tabela (Escuro e Profissional)
  const headers = [
    'ITEM',
    'PEDIDO',
    'LM',
    'QUANTIDADE',
    'PALETE',
    'DATA DO INVENTÁRIO',
  ];
  const headerRow = sheet.getRow(3);
  headerRow.values = headers;
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1C1C1C' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF374151' } },
      right: { style: 'thin', color: { argb: 'FF374151' } },
    };
  });

  // Linhas de Dados
  items.forEach((item, idx) => {
    const rowNumber = idx + 4;
    const row = sheet.getRow(rowNumber);

    const parsedQtd = Number(item.quantidade);
    const qtdVal =
      item.quantidade !== '' && !isNaN(parsedQtd)
        ? parsedQtd
        : item.quantidade || '';

    row.values = [
      idx + 1,
      item.pedido || '',
      item.lm || '',
      qtdVal,
      item.palete || '',
      item.dataInventario || todayFormatted,
    ];
    row.height = 22;

    const isEven = idx % 2 === 1;
    const rowBg = isEven ? 'FFF3F4F6' : 'FFFFFFFF';

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: 'Arial',
        size: 10.5,
        bold: colNumber === 2 || colNumber === 5,
        color: { argb: 'FF111827' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });
  });

  // Ativa AutoFiltro no cabeçalho da tabela (A3:F3)
  sheet.autoFilter = {
    from: 'A3',
    to: {
      row: Math.max(3, items.length + 3),
      column: 6,
    },
  };

  // Gera o buffer e dispara o download no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateSlug = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `inventario-materiais-mapev-${dateSlug}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
