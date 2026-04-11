import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { InventoryItem } from '../types';

interface InventoryContextType {
  inventory: InventoryItem[];
  loading: boolean;
  addRow: (data: any) => Promise<boolean>;
  updateRow: (id: any, data: any) => Promise<boolean>;
  deleteRow: (id: any) => Promise<boolean>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: inventory, loading, addRow, updateRow, deleteRow } = useSupabaseTable<InventoryItem>('inventory');
  return (
    <InventoryContext.Provider value={{ inventory, loading, addRow, updateRow, deleteRow }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
};
