import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LogEntry, UndoData } from '../types';
import { supabase } from '../lib/supabase';
import { useNotification } from './NotificationContext';

interface LogContextType {
  actionLogs: LogEntry[];
  addLog: (type: string, content: string, status: 'success' | 'error', tableName: string, undoData?: UndoData) => void;
  undoAction: (logId: string) => Promise<void>;
  loading: boolean;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actionLogs, setActionLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('action_logs')
      .select('*, profiles:user_id(name, role)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setActionLogs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();

    const channelId = `changes-action_logs-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  const addLog = useCallback(async (type: string, content: string, status: 'success' | 'error', tableName: string, undoData?: UndoData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;

    const newLog = {
      type,
      content,
      status,
      table_name: tableName,
      user_id: user_id,
      undo_data: undoData || null,
      undone: false,
    };

    const { error } = await supabase.from('action_logs').insert([newLog]);
    if (error) {
       console.error('Error adding log:', error);
    } else {
       await fetchLogs();
    }
  }, [fetchLogs]);

  const undoAction = useCallback(async (logId: string) => {
    const log = actionLogs.find((l) => l.id === logId);
    if (!log || log.undone || !log.undo_data) return;

    // Verify ownership: Owner can undo everything, others can only undo self
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    
    if (profile?.role !== 'owner' && profile?.role !== 'dev' && log.user_id !== user?.id) {
      showNotification('Bạn chỉ có thể hoàn tác hành động của chính mình!', 'error');
      return;
    }

    const { action, tableName, itemId, previousItem, currentItemId } = log.undo_data;
    let detail = '';
    let success = false;

    try {
      if (action === 'add' && itemId) {
        const { error } = await supabase.from(tableName).delete().eq('id', itemId);
        if (error) throw error;
        detail = `Hoàn tác: Đã xoá bản ghi vừa thêm vào bảng "${tableName}".`;
        success = true;
      } 
      else if (action === 'delete' && previousItem) {
        const { error } = await supabase.from(tableName).insert([previousItem]);
        if (error) throw error;
        detail = `Hoàn tác: Đã đưa "${previousItem.name || 'bản ghi'}" trở lại bảng "${tableName}".`;
        success = true;
      }
      else if (action === 'edit' && currentItemId && previousItem) {
        const { error } = await supabase.from(tableName).update(previousItem).eq('id', currentItemId);
        if (error) throw error;
        detail = `Hoàn tác: Đã khôi phục dữ liệu cũ cho "${previousItem.name || 'bản ghi'}".`;
        success = true;
      }

      if (success) {
        // Cập nhật trạng thái undone của log này trên Supabase
        const { error: updateLogError } = await supabase
          .from('action_logs')
          .update({ undone: true })
          .eq('id', logId);

        if (updateLogError) throw updateLogError;

        // Thêm một log mới báo là đã hoàn tác
        await addLog('Hoàn tác', detail, 'success', 'action_logs');
        showNotification('Hoàn tác thành công!', 'success');
      }
    } catch (error: any) {
      showNotification('Lỗi khi hoàn tác: ' + error.message, 'error');
      await addLog('Hoàn tác', 'Lỗi: ' + error.message, 'error', 'action_logs');
    }
  }, [actionLogs, addLog, showNotification]);

  return (
    <LogContext.Provider value={{ actionLogs, addLog, undoAction, loading }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) throw new Error('useLog must be used within LogProvider');
  return context;
};
