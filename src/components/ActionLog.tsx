import React from 'react';
import { useLog } from '../context/LogContext';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

interface ActionLogProps {
  tableName: string;
}

const ActionLog: React.FC<ActionLogProps> = ({ tableName }) => {
  const { actionLogs, undoAction, loading } = useLog();
  const { profile } = useAuth();
  const { showConfirm } = useDialog();

  const filteredLogs = actionLogs.filter(log => log.table_name === tableName);

  const handleUndo = async (logId: string) => {
    const confirmed = await showConfirm('Bạn có chắc chắn muốn hoàn tác thao tác này không?');
    if (confirmed) {
      await undoAction(logId);
    }
  };

  return (
    <section className="global-log-panel glass p-6 mt-6">
      <h3 className="mb-4">Nhật ký hoạt động</h3>
      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th className="cell-center">Thời gian</th>
              <th className="cell-center">Người thực hiện</th>
              <th className="cell-center">Loại thao tác</th>
              <th>Nội dung</th>
            </tr>
          </thead>
          <tbody id="actionLogTableBody">
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-row text-center p-4">Đang tải nhật ký...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row text-center p-4">Chưa có hoạt động nào.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isFullAccess = profile?.role === 'owner' || profile?.role === 'dev';
                const isMyAction = log.user_id === profile?.id;
                const canUndo = (isFullAccess || isMyAction) && log.undo_data && !log.undone;
                
                return (
                  <tr key={log.id}>
                    <td data-label="Thời gian" className="cell-center text-xs">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td data-label="Người thực hiện" className="cell-center font-bold">
                      {(() => {
                        const profiles = Array.isArray(log.profiles) ? log.profiles : [log.profiles];
                        const mainProfile = profiles[0];
                        if (!mainProfile) return 'Hệ thống';
                        return (
                          <span>
                            {mainProfile.name}
                            {mainProfile.role === 'dev' && (
                              <span className="text-blue-500 ml-1 text-[10px] font-normal opacity-80">( Developer )</span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                    <td data-label="Loại thao tác" className="cell-center">
                      {log.type}
                      {canUndo && (
                        <button 
                          className="btn btn-warning btn-xs ml-2" 
                          onClick={() => handleUndo(log.id)}
                        >
                          Hoàn tác
                        </button>
                      )}
                      {log.undone && (
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'white',
                          backgroundColor: log.undo_data?.action === 'add' ? '#dc2626' : '#059669',
                          marginLeft: '8px'
                        }}>
                          {log.undo_data?.action === 'add' ? 'Xoá' : 'Hoàn tác'}
                        </span>
                      )}
                    </td>
                    <td data-label="Nội dung" className={log.status === 'error' ? 'text-danger' : ''}>
                      {log.content}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ActionLog;
