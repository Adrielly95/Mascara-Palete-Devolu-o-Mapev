export type SupplierType = 'LEROY MERLIN' | 'TELHANORTE';

export interface PalletConfig {
  supplier: SupplierType;
  exitDate: string; // YYYY-MM-DD from input[type="date"]
  totalPallets: number;
}

export interface MaterialItem {
  id: string;
  pedido: string;
  lm: string;
  quantidade: string;
  palete?: string;
  dataInventario?: string; // DD/MM/AAAA
  batchId?: string;
}

export interface InventoryBatchRecord {
  id: string;
  ownerId: string;
  title: string;
  supplier: SupplierType;
  batchDate: string;
  totalItems: number;
}

export type ActiveTab = 'palete' | 'material' | 'historico';
