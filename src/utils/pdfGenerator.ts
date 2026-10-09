import { jsPDF } from 'jspdf';
import { MaterialItem, PalletConfig } from '../types';
import { formatBrazilianDate } from '../components/PalletMask';

/**
 * Desenha o logotipo vetorial MAPEV SOLUÇÕES LOGÍSTICAS diretamente no jsPDF
 */
function drawMapevLogoPdf(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const sx = w / 1000;
  const sy = h / 1000;

  // 1. Forma amarela principal (#F5C400)
  doc.setFillColor(245, 196, 0);
  doc.lines(
    [
      [(460 - 88) * sx, 0],
      [(584 - 460) * sx, (524 - 26) * sy],
      [(88 - 584) * sx, 0],
    ],
    x + 88 * sx,
    y + 26 * sy,
    [1, 1],
    'F',
    true
  );

  // 4 recortes horizontais pretos formando as 5 barras amarelas conectadas à direita
  doc.setFillColor(0, 0, 0);
  const cutouts = [
    { y1: 85, y2: 112, xr1: 388, xr2: 397 },
    { y1: 178, y2: 218, xr1: 417, xr2: 429 },
    { y1: 285, y2: 324, xr1: 449, xr2: 461 },
    { y1: 392, y2: 430, xr1: 482, xr2: 494 },
  ];
  cutouts.forEach((c) => {
    doc.lines(
      [
        [(c.xr1 - 86) * sx, 0],
        [(c.xr2 - c.xr1) * sx, (c.y2 - c.y1) * sy],
        [(86 - c.xr2) * sx, 0],
      ],
      x + 86 * sx,
      y + c.y1 * sy,
      [1, 1],
      'F',
      true
    );
  });

  // 2. Cabine do caminhão branca à direita
  doc.setFillColor(255, 255, 255);
  doc.lines(
    [
      [(738 - 505) * sx, 0],
      [(782 - 738) * sx, (322 - 96) * sy],
      [(868 - 782) * sx, 0],
      [(918 - 868) * sx, (524 - 322) * sy],
      [(598 - 918) * sx, 0],
    ],
    x + 505 * sx,
    y + 96 * sy,
    [1, 1],
    'F',
    true
  );

  // Arco de roda recortado em preto na base da cabine
  doc.setFillColor(0, 0, 0);
  doc.ellipse(
    x + 760 * sx,
    y + 526 * sy,
    65 * sx,
    68 * sy,
    'F'
  );

  // 3. Texto "MAPEV"
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22.5);
  doc.text('MAPEV', x + w / 2, y + 765 * sy, {
    align: 'center',
    charSpace: 1.2,
  });

  // 4. Linha branca horizontal abaixo de MAPEV
  doc.setFillColor(255, 255, 255);
  doc.rect(x + 18 * sx, y + 836 * sy, 964 * sx, 19 * sy, 'F');

  // 5. Subtítulo "SOLUÇÕES LOGÍSTICAS"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.text('SOLUÇÕES LOGÍSTICAS', x + w / 2, y + 952 * sy, {
    align: 'center',
    charSpace: 0.45,
  });
}

/**
 * Desenha uma página individual da Máscara de Palete (A4 Paisagem 297mm x 210mm)
 * fielmente idêntica à imagem de referência enviada.
 */
function drawPalletPage(
  doc: jsPDF,
  config: PalletConfig,
  palletNumber: number,
  totalPallets: number
) {
  const leftX = 8.5;
  const contentW = 268.5;

  // 1. Barra Superior Preta (Cabeçalho + DEVOLUÇÃO)
  const box1Y = 17.5;
  const box1H = 30.0;
  doc.setFillColor(0, 0, 0);
  doc.rect(leftX, box1Y, contentW, box1H, 'F');

  // Logo MAPEV à esquerda dentro da barra preta
  drawMapevLogoPdf(doc, leftX + 7, box1Y + 2.2, 46, 26);

  // Texto "DEVOLUÇÃO" centralizado na área principal da barra preta
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(66);
  doc.text('DEVOLUÇÃO', leftX + contentW * 0.565, box1Y + 22.8, {
    align: 'center',
  });

  // 2. Segunda Barra: FORNECEDOR | LEROY MERLIN / TELHANORTE
  const box2Y = 51.8;
  const box2H = 36.2;
  const colSplit1 = contentW * 0.331;

  doc.setFillColor(242, 242, 242);
  doc.rect(leftX, box2Y, colSplit1, box2H, 'F');

  doc.setFillColor(255, 255, 255);
  doc.rect(leftX + colSplit1, box2Y, contentW - colSplit1, box2H, 'F');

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.75);
  doc.rect(leftX, box2Y, contentW, box2H, 'S');
  doc.line(leftX + colSplit1, box2Y, leftX + colSplit1, box2Y + box2H);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32.5);
  doc.text('FORNECEDOR', leftX + colSplit1 / 2, box2Y + 22.5, {
    align: 'center',
  });

  doc.setFontSize(47);
  doc.text(
    config.supplier,
    leftX + colSplit1 + (contentW - colSplit1) / 2,
    box2Y + 24.3,
    { align: 'center' }
  );

  // 3. Terceira Barra: DATA | DD/MM/AAAA
  const box3Y = 92.4;
  const box3H = 33.2;

  doc.setFillColor(242, 242, 242);
  doc.rect(leftX, box3Y, colSplit1, box3H, 'F');

  doc.setFillColor(255, 255, 255);
  doc.rect(leftX + colSplit1, box3Y, contentW - colSplit1, box3H, 'F');

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.75);
  doc.rect(leftX, box3Y, contentW, box3H, 'S');
  doc.line(leftX + colSplit1, box3Y, leftX + colSplit1, box3Y + box3H);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(33);
  doc.text('DATA', leftX + colSplit1 / 2, box3Y + 21.2, {
    align: 'center',
  });

  const formattedDate = formatBrazilianDate(config.exitDate);
  doc.setFontSize(45);
  doc.text(
    formattedDate,
    leftX + colSplit1 + (contentW - colSplit1) / 2,
    box3Y + 22.6,
    { align: 'center' }
  );

  // 4. Quarta Barra: PALETE | X de Y
  const box4Y = 131.6;
  const box4H = 47.0;
  const colSplitPallet = contentW * 0.482;

  doc.setFillColor(28, 28, 28);
  doc.rect(leftX, box4Y, colSplitPallet, box4H, 'F');

  doc.setFillColor(255, 255, 255);
  doc.rect(
    leftX + colSplitPallet,
    box4Y,
    contentW - colSplitPallet,
    box4H,
    'F'
  );

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.75);
  doc.rect(leftX, box4Y, contentW, box4H, 'S');
  doc.line(
    leftX + colSplitPallet,
    box4Y,
    leftX + colSplitPallet,
    box4Y + box4H
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(46);
  doc.text('PALETE', leftX + colSplitPallet / 2, box4Y + 29.5, {
    align: 'center',
  });

  doc.setTextColor(0, 0, 0);
  const rightCenterX = leftX + colSplitPallet + (contentW - colSplitPallet) / 2;
  const baselineY = box4Y + 34.5;

  const num1Str = String(palletNumber);
  const deStr = ' de ';
  const num2Str = String(totalPallets);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(92);
  const w1 = doc.getTextWidth(num1Str);
  const w2 = doc.getTextWidth(num2Str);

  doc.setFontSize(40);
  const wDe = doc.getTextWidth(deStr);

  const totalTextW = w1 + wDe + w2;
  const startTextX = rightCenterX - totalTextW / 2;

  doc.setFontSize(92);
  doc.text(num1Str, startTextX, baselineY);

  doc.setFontSize(40);
  doc.text(deStr, startTextX + w1, baselineY - 1.5);

  doc.setFontSize(92);
  doc.text(num2Str, startTextX + w1 + wDe, baselineY);
}

/**
 * Gera instância jsPDF da Máscara de Palete (uma página específica ou todas)
 */
export function createPalletPdfDocument(
  config: PalletConfig,
  singlePalletNumber?: number
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const total = Math.max(1, Math.min(300, Number(config.totalPallets) || 1));
  const pagesToGenerate = singlePalletNumber
    ? [singlePalletNumber]
    : Array.from({ length: total }, (_, i) => i + 1);

  pagesToGenerate.forEach((palletNum, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }
    drawPalletPage(doc, config, palletNum, total);
  });

  return doc;
}

/**
 * Baixa o arquivo PDF da Máscara de Palete (1 página ou todas)
 */
export function downloadPalletPdf(
  config: PalletConfig,
  singlePalletNumber?: number
) {
  const doc = createPalletPdfDocument(config, singlePalletNumber);
  const supplierSlug = config.supplier.toLowerCase().replace(/\s+/g, '-');
  const total = Math.max(1, Math.min(300, Number(config.totalPallets) || 1));
  const fileName = singlePalletNumber
    ? `mascara-palete-${supplierSlug}-${singlePalletNumber}-de-${total}.pdf`
    : `mascara-paletes-${supplierSlug}-1-a-${total}.pdf`;
  doc.save(fileName);
}

/**
 * Desenha um bloco individual de Material exatamente como no PDF oficial enviado:
 * - Linha 1: Cabeçalho escuro (#1C1C1C) com "DEVOLUÇÃO" em branco centralizado
 * - Linha 2: Coluna esquerda cinza (#F2F2F2) "PEDIDO" | Coluna direita branca com valor
 * - Linha 3: Coluna esquerda cinza (#F2F2F2) "LM" | Coluna direita branca com valor
 * - Linha 4: Coluna esquerda cinza (#F2F2F2) "QUANTIDADE" | Coluna direita branca com valor
 */
function drawSingleMaterialBlockPdf(
  doc: jsPDF,
  bx: number,
  by: number,
  colW: number,
  rowH: number,
  block?: MaterialItem
) {
  const lineH = rowH / 4; // 4 linhas de alturas iguais (~10.75mm cada)
  const labelColW = colW * 0.298; // ~35.2mm (proporção idêntica ao PDF original)
  const valueColW = colW - labelColW;

  // 1. Linha 1: Fundo escuro (#1C1C1C) para DEVOLUÇÃO
  doc.setFillColor(28, 28, 28);
  doc.rect(bx, by, colW, lineH, 'F');

  // 2. Linhas 2, 3 e 4: Coluna esquerda cinza claro (#F2F2F2) e direita branca
  for (let r = 1; r <= 3; r++) {
    const ry = by + r * lineH;
    doc.setFillColor(242, 242, 242);
    doc.rect(bx, ry, labelColW, lineH, 'F');

    doc.setFillColor(255, 255, 255);
    doc.rect(bx + labelColW, ry, valueColW, lineH, 'F');
  }

  // Borda externa mais espessa e linhas divisórias internas
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.65);
  doc.rect(bx, by, colW, rowH, 'S');

  doc.setLineWidth(0.35);
  // Linhas horizontais internas
  for (let r = 1; r <= 3; r++) {
    const ry = by + r * lineH;
    doc.line(bx, ry, bx + colW, ry);
  }
  // Linha vertical interna (apenas nas linhas 2, 3 e 4)
  doc.line(bx + labelColW, by + lineH, bx + labelColW, by + rowH);

  // Texto Linha 1: DEVOLUÇÃO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DEVOLUÇÃO', bx + colW / 2, by + lineH * 0.68, { align: 'center' });

  // Rótulos à esquerda: PEDIDO, LM, QUANTIDADE
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text('PEDIDO', bx + labelColW / 2, by + lineH * 1.65, {
    align: 'center',
  });
  doc.text('LM', bx + labelColW / 2, by + lineH * 2.65, {
    align: 'center',
  });
  doc.text('QUANTIDADE', bx + labelColW / 2, by + lineH * 3.65, {
    align: 'center',
  });

  // Valores à direita (se preenchidos)
  if (block) {
    doc.setFontSize(15);
    const valCenterX = bx + labelColW + valueColW / 2;
    if (block.pedido) {
      doc.text(block.pedido, valCenterX, by + lineH * 1.68, {
        align: 'center',
      });
    }
    if (block.lm) {
      doc.text(block.lm, valCenterX, by + lineH * 2.68, {
        align: 'center',
      });
    }
    if (block.quantidade) {
      doc.text(block.quantidade, valCenterX, by + lineH * 3.68, {
        align: 'center',
      });
    }
  }
}

/**
 * Gera instância jsPDF da Máscara de Material em A4 Paisagem (297mm x 210mm)
 * fielmente idêntica ao PDF oficial enviado (grade 2 colunas x 3 linhas).
 */
export function createMaterialPdfDocument(
  items: MaterialItem[],
  singlePageIndex?: number
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const allPages: MaterialItem[][] = [];
  if (items.length === 0) {
    allPages.push([]);
  } else {
    for (let i = 0; i < items.length; i += 6) {
      allPages.push(items.slice(i, i + 6));
    }
  }

  const targetPages =
    singlePageIndex !== undefined && allPages[singlePageIndex]
      ? [allPages[singlePageIndex]]
      : allPages;

  // Coordenadas exatas medidas do PDF oficial (A4 Paisagem 297 x 210 mm)
  const colX = [19.5, 146.0]; // Coluna 1 e Coluna 2
  const rowY = [21.2, 79.0, 127.0]; // Linha 1, Linha 2 e Linha 3
  const blockW = 118.0;
  const blockH = 43.2;

  targetPages.forEach((pageBlocks, pIdx) => {
    if (pIdx > 0) {
      doc.addPage('a4', 'landscape');
    }

    // Desenha os 6 quadros da folha (preenchidos com os itens da página)
    for (let slot = 0; slot < 6; slot++) {
      const col = slot % 2;
      const row = Math.floor(slot / 2);
      const bx = colX[col];
      const by = rowY[row];
      const blockData = pageBlocks[slot];
      drawSingleMaterialBlockPdf(doc, bx, by, blockW, blockH, blockData);
    }
  });

  return doc;
}

/**
 * Baixa o arquivo PDF da Máscara de Material (1 folha ou todas)
 */
export function downloadMaterialPdf(
  items: MaterialItem[],
  singlePageIndex?: number
) {
  const doc = createMaterialPdfDocument(items, singlePageIndex);
  const fileName =
    singlePageIndex !== undefined
      ? `mascara-material-folha-${singlePageIndex + 1}.pdf`
      : `mascara-material-completa.pdf`;
  doc.save(fileName);
}

/**
 * Aciona a impressão nativa utilizando um iframe oculto com o PDF vetorial gerado,
 * garantindo que funcione dentro de iframes e imprima exatamente a(s) página(s) desejada(s).
 */
export function triggerPdfPrint(doc: jsPDF) {
  try {
    doc.autoPrint();
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    const existingIframe = document.getElementById(
      'mapev-print-iframe'
    ) as HTMLIFrameElement | null;
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'mapev-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0.01';
    iframe.src = blobUrl;

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        }
      }, 250);
    };

    document.body.appendChild(iframe);
  } catch {
    window.print();
  }
}
