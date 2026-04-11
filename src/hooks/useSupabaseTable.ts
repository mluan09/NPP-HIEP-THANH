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
      // Bug #3 Fix: Chỉ log lỗi fetch, không show notification để tránh trùng với component
      console.error(`Error fetching ${tableName}:`, error.message);
    } else {
      setData(result as T[]);
    }
    setLoading(false);
  }, [tableName]);

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
      // Bug #3 Fix: Xoá showNotification dư thừa ở đây — component đã xử lý thông báo qua addLog
      console.error(`Error adding record to ${tableName}:`, error.message);
      showNotification(`Lỗi khi thêm bản ghi: ${error.message}`, 'error');
      return false;
    }
    await fetchData();
    return true;
  };

  const updateRow = async (id: any, updatedData: any) => {
    const { error } = await supabase.from(tableName).update(updatedData).eq('id', id);
    if (error) {
      // Bug #3 Fix: Chỉ show lỗi, thành công sẽ do component thông báo qua addLog
      console.error(`Error updating record in ${tableName}:`, error.message);
      showNotification(`Lỗi khi cập nhật bản ghi: ${error.message}`, 'error');
      return false;
    }
    await fetchData();
    return true;
  };

  const deleteRow = async (id: any) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
      // Bug #3 Fix: Chỉ show lỗi, thành công sẽ do component thông báo qua addLog
      console.error(`Error deleting record from ${tableName}:`, error.message);
      showNotification(`Lỗi khi xoá bản ghi: ${error.message}`, 'error');
      return false;
    }
    await fetchData();
    return true;
  };

  return { data, loading, fetchData, addRow, updateRow, deleteRow };
}
