/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  ActiveTab,
  InventoryBatchRecord,
  MaterialItem,
  PalletConfig,
  SupplierType,
} from './types';
import { PalletMask, formatBrazilianDate } from './components/PalletMask';
import { MaterialMask } from './components/MaterialMask';
import { InventoryHistory } from './components/InventoryHistory';
import { MapevLogo } from './components/MapevLogo';

const TODAY_ISO = new Date().toISOString().split('T')[0];
const TODAY_BR = formatBrazilianDate(TODAY_ISO);

const INITIAL_PALLET_CONFIG: PalletConfig = {
  supplier: 'LEROY MERLIN',
  exitDate: TODAY_ISO,
  totalPallets: 15,
};

const INITIAL_LOCAL_ITEMS: MaterialItem[] = [
  {
    id: 'mat-1',
    pedido: '45091820',
    lm: '89120411',
    quantidade: '12',
    palete: '1',
    dataInventario: TODAY_BR,
    batchId: 'active',
  },
  {
    id: 'mat-2',
    pedido: '45091821',
    lm: '89431029',
    quantidade: '24',
    palete: '1',
    dataInventario: TODAY_BR,
    batchId: 'active',
  },
  {
    id: 'mat-3',
    pedido: '45091825',
    lm: '89774100',
    quantidade: '6',
    palete: '1',
    dataInventario: TODAY_BR,
    batchId: 'active',
  },
  {
    id: 'mat-4',
    pedido: '45091830',
    lm: '89215088',
    quantidade: '18',
    palete: '2',
    dataInventario: TODAY_BR,
    batchId: 'active',
  },
  {
    id: 'mat-5',
    pedido: '45091834',
    lm: '89650112',
    quantidade: '10',
    palete: '2',
    dataInventario: TODAY_BR,
    batchId: 'active',
  },
  {
    id: 'mat-6',
    pedido: '45091840',
    lm: '89301944',
    quantidade: '30',
    palete: '2',
    dataInventario: TODAY_BR,
    batchId: 'active',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('palete');
  const [palletConfig, setPalletConfig] = useState<PalletConfig>(
    INITIAL_PALLET_CONFIG
  );

  // Autenticação Firebase
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Estado local (usado quando não logado) e estado sincronizado da nuvem
  const [localItems, setLocalItems] = useState<MaterialItem[]>(
    INITIAL_LOCAL_ITEMS
  );
  const [cloudActiveItems, setCloudActiveItems] = useState<MaterialItem[]>([]);
  const [batches, setBatches] = useState<InventoryBatchRecord[]>([]);
  const [batchItemsMap, setBatchItemsMap] = useState<
    Record<string, MaterialItem[]>
  >({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sincronização em tempo real com Firestore quando autenticado
  useEffect(() => {
    if (!isAuthReady || !user) {
      setCloudActiveItems([]);
      setBatches([]);
      setBatchItemsMap({});
      return;
    }

    const itemsQuery = query(
      collection(db, 'inventoryItems'),
      where('ownerId', '==', user.uid)
    );

    const unsubItems = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const activeList: MaterialItem[] = [];
        const groupedByBatch: Record<string, MaterialItem[]> = {};

        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const item: MaterialItem = {
            id: docSnap.id,
            pedido: d.pedido || '',
            lm: d.lm || '',
            quantidade: d.quantidade || '',
            palete: d.palete || '',
            dataInventario: d.dataInventario || TODAY_BR,
            batchId: d.batchId || 'active',
          };
          if (item.batchId === 'active') {
            activeList.push(item);
          } else if (item.batchId) {
            if (!groupedByBatch[item.batchId]) {
              groupedByBatch[item.batchId] = [];
            }
            groupedByBatch[item.batchId].push(item);
          }
        });

        setCloudActiveItems(activeList);
        setBatchItemsMap(groupedByBatch);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inventoryItems');
      }
    );

    const batchesQuery = query(
      collection(db, 'inventoryBatches'),
      where('ownerId', '==', user.uid)
    );

    const unsubBatches = onSnapshot(
      batchesQuery,
      (snapshot) => {
        const list: InventoryBatchRecord[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            ownerId: d.ownerId,
            title: d.title || 'Inventário',
            supplier:
              d.supplier === 'TELHANORTE' ? 'TELHANORTE' : 'LEROY MERLIN',
            batchDate: d.batchDate || TODAY_BR,
            totalItems: Number(d.totalItems) || 0,
          };
        });
        setBatches(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inventoryBatches');
      }
    );

    return () => {
      unsubItems();
      unsubBatches();
    };
  }, [isAuthReady, user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Erro ao autenticar com Google:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const activeItems = user ? cloudActiveItems : localItems;

  const handleAddItem = async (newItemData: Omit<MaterialItem, 'id'>) => {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (!user) {
      setLocalItems((prev) => [...prev, { id: itemId, ...newItemData }]);
      return;
    }

    try {
      await setDoc(doc(db, 'inventoryItems', itemId), {
        ownerId: user.uid,
        pedido: (newItemData.pedido || '').slice(0, 100),
        lm: (newItemData.lm || '').slice(0, 100),
        quantidade: (newItemData.quantidade || '').slice(0, 50),
        palete: (newItemData.palete || '').slice(0, 50),
        dataInventario: (newItemData.dataInventario || TODAY_BR).slice(0, 40),
        batchId: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `inventoryItems/${itemId}`
      );
    }
  };

  const handleUpdateItem = async (updatedItem: MaterialItem) => {
    if (!user) {
      setLocalItems((prev) =>
        prev.map((it) => (it.id === updatedItem.id ? updatedItem : it))
      );
      return;
    }

    try {
      await updateDoc(doc(db, 'inventoryItems', updatedItem.id), {
        pedido: (updatedItem.pedido || '').slice(0, 100),
        lm: (updatedItem.lm || '').slice(0, 100),
        quantidade: (updatedItem.quantidade || '').slice(0, 50),
        palete: (updatedItem.palete || '').slice(0, 50),
        dataInventario: (updatedItem.dataInventario || TODAY_BR).slice(0, 40),
        batchId: updatedItem.batchId || 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `inventoryItems/${updatedItem.id}`
      );
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) {
      setLocalItems((prev) => prev.filter((it) => it.id !== itemId));
      return;
    }

    try {
      await deleteDoc(doc(db, 'inventoryItems', itemId));
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `inventoryItems/${itemId}`
      );
    }
  };

  const handleClearAll = async () => {
    if (!user) {
      setLocalItems([]);
      return;
    }

    try {
      await Promise.all(
        cloudActiveItems.map((it) =>
          deleteDoc(doc(db, 'inventoryItems', it.id))
        )
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'inventoryItems');
    }
  };

  const handleSaveToHistory = async (
    title: string,
    supplier: SupplierType
  ) => {
    if (!user || activeItems.length === 0) return;

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    try {
      await setDoc(doc(db, 'inventoryBatches', batchId), {
        ownerId: user.uid,
        title: title.slice(0, 120),
        supplier,
        batchDate: TODAY_BR,
        totalItems: activeItems.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Cria cópias vinculadas ao lote salvo no histórico
      await Promise.all(
        activeItems.map((item, idx) => {
          const histItemId = `${batchId}_item_${idx + 1}`;
          return setDoc(doc(db, 'inventoryItems', histItemId), {
            ownerId: user.uid,
            pedido: (item.pedido || '').slice(0, 100),
            lm: (item.lm || '').slice(0, 100),
            quantidade: (item.quantidade || '').slice(0, 50),
            palete: (item.palete || '').slice(0, 50),
            dataInventario: (item.dataInventario || TODAY_BR).slice(0, 40),
            batchId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        })
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `inventoryBatches/${batchId}`
      );
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!user) return;
    try {
      const bItems = batchItemsMap[batchId] || [];
      await Promise.all(
        bItems.map((it) => deleteDoc(doc(db, 'inventoryItems', it.id)))
      );
      await deleteDoc(doc(db, 'inventoryBatches', batchId));
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `inventoryBatches/${batchId}`
      );
    }
  };

  const handleLoadBatchIntoWorkspace = async (
    _batch: InventoryBatchRecord,
    bItems: MaterialItem[]
  ) => {
    if (!user) return;
    try {
      // Substitui itens ativos pelos itens do lote selecionado
      await Promise.all(
        cloudActiveItems.map((it) =>
          deleteDoc(doc(db, 'inventoryItems', it.id))
        )
      );
      await Promise.all(
        bItems.map((item, idx) => {
          const newActiveId = `active_${Date.now()}_${idx}`;
          return setDoc(doc(db, 'inventoryItems', newActiveId), {
            ownerId: user.uid,
            pedido: (item.pedido || '').slice(0, 100),
            lm: (item.lm || '').slice(0, 100),
            quantidade: (item.quantidade || '').slice(0, 50),
            palete: (item.palete || '').slice(0, 50),
            dataInventario: (item.dataInventario || TODAY_BR).slice(0, 40),
            batchId: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        })
      );
      setActiveTab('material');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventoryItems');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-900">
      {/* Top Bar Contract - Cabeçalho Preto com Logo Oficial MAPEV (Oculto na Impressão) */}
      <header className="no-print sticky top-0 z-30 bg-black text-white border-b-2 border-[#F5C400] px-6 py-2.5 shadow-sm">
        <div className="max-w-[1122px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Logo Oficial MAPEV */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('palete');
            }}
            className="flex items-center shrink-0 focus:outline-none"
            aria-label="MAPEV Soluções Logísticas"
          >
            <MapevLogo className="h-14 w-auto" />
          </a>

          {/* Zone 2: Navigation tabs */}
          <nav
            aria-label="Módulos de Etiquetas"
            className="flex items-center gap-6 sm:gap-8 text-sm font-bold"
          >
            <button
              type="button"
              onClick={() => setActiveTab('palete')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'palete'
                  ? 'border-[#F5C400] text-[#F5C400]'
                  : 'border-transparent text-neutral-300 hover:text-white'
              }`}
            >
              1. Máscara de Palete
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'material'
                  ? 'border-[#F5C400] text-[#F5C400]'
                  : 'border-transparent text-neutral-300 hover:text-white'
              }`}
            >
              2. Máscara de Material
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'historico'
                  ? 'border-[#F5C400] text-[#F5C400]'
                  : 'border-transparent text-neutral-300 hover:text-white'
              }`}
            >
              3. Histórico ({batches.length})
            </button>
          </nav>

          {/* Zone 3: 1 primary action (Autenticação / Sincronização Nuvem) */}
          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                title={`Conectado como ${user.email || user.displayName}`}
                className="px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                Sair ({user.displayName?.split(' ')[0] || 'Conta'})
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-black bg-[#F5C400] hover:bg-[#E0B200] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                Entrar e Sincronizar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 py-8 px-4 sm:px-6 overflow-x-auto print:p-0 print:m-0 print:overflow-visible">
        {activeTab === 'palete' && (
          <PalletMask config={palletConfig} onChange={setPalletConfig} />
        )}

        {activeTab === 'material' && (
          <MaterialMask
            items={activeItems}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onClearAll={handleClearAll}
            isAuthenticated={Boolean(user)}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'historico' && (
          <InventoryHistory
            isAuthenticated={Boolean(user)}
            onLogin={handleLogin}
            batches={batches}
            batchItemsMap={batchItemsMap}
            onLoadBatchIntoWorkspace={handleLoadBatchIntoWorkspace}
            onDeleteBatch={handleDeleteBatch}
          />
        )}
      </main>

      {/* Rodapé - Oculto na Impressão */}
      <footer className="no-print border-t border-neutral-200 bg-white py-4 px-6 text-center text-xs text-neutral-500">
        MAPEV Soluções Logísticas · Sistema Gerador de Etiquetas A4 e Inventário Sincronizado na Nuvem
      </footer>
    </div>
  );
}
