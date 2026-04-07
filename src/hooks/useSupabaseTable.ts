import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';

export function useSupabaseTable<T extends { id: any }>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      showNotification(`Error fetching ${tableName}: ${error.message}`, 'error');
    } else {
      setData(result as T[]);
    }
    setLoading(false);
  }, [tableName, showNotification]);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription with a unique channel name to avoid collisions
    const channelId = `changes-${tableName}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fetchData]);

  const addRow = async (newData: any) => {
    const { error } = await supabase.from(tableName).insert([newData]);
    if (error) {
      showNotification(`Error adding record: ${error.message}`, 'error');
      return false;
    }
    await fetchData();
    showNotification('Đã thêm bản ghi mới thành công!', 'success');
    return true;
  };

  const updateRow = async (id: any, updatedData: any) => {
    const { error } = await supabase.from(tableName).update(updatedData).eq('id', id);
    if (error) {
      showNotification(`Error updating record: ${error.message}`, 'error');
      return false;
    }
    await fetchData();
    showNotification('Đã cập nhật bản ghi thành công!', 'success');
    return true;
  };

  const deleteRow = async (id: any) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      showNotification(`Error deleting record: ${error.message}`, 'error');
      return false;
    }
    await fetchData();
    showNotification('Đã xoá bản ghi thành công!', 'success');
    return true;
  };

  return { data, loading, fetchData, addRow, updateRow, deleteRow };
}
