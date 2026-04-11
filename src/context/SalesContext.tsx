import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { DailySaleRow } from '../types';

interface SalesContextType {
  sales: DailySaleRow[];
  loading: boolean;
  addRow: (data: any) => Promise<boolean>;
  updateRow: (id: any, data: any) => Promise<boolean>;
  deleteRow: (id: any) => Promise<boolean>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: sales, loading, addRow, updateRow, deleteRow } = useSupabaseTable<DailySaleRow>('sales');
  return (
    <SalesContext.Provider value={{ sales, loading, addRow, updateRow, deleteRow }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used within SalesProvider');
  return ctx;
};
