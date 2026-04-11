import React, { useMemo, useState } from 'react';
import { DailySaleRow } from '../types';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';
import { useLog } from '../context/LogContext';
import { useDialog } from '../context/DialogContext';
import { useProductCosts } from '../hooks/useProductCosts';
import TablePagination from './TablePagination';
import SkeletonRows from './SkeletonRows';

const SalesTable: React.FC = () => {
  // Improvement #6: dùng SalesContext thay vì hook riêng
  const { sales, loading, addRow, updateRow, deleteRow } = useSales();
  const { profile } = useAuth();
  const { addLog } = useLog();
  const { showAlert, showConfirm } = useDialog();
  // Improvement #3: giá vốn từ bảng kho thay vì hardcode
  const costs = useProductCosts();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Improvement #7: date filter cho bảng bán hàng
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [formData, setFormData] = useState<Partial<DailySaleRow>>({
    seller: '', date: new Date().toISOString().split('T')[0],
    customer: '', address: '', g8: 0, abest_tall: 0, abest_short: 0, sale_price: 0
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, sale_price: rawDigits ? parseInt(rawDigits, 10) : 0 });
  };

  // Improvement #7: lọc theo ngày
  const filteredSales = useMemo(() => {
    let result = [...sales];
    if (dateFrom) result = result.filter(r => r.date >= dateFrom);
    if (dateTo) result = result.filter(r => r.date <= dateTo);
    return result;
  }, [sales, dateFrom, dateTo]);

  const handleSave = async () => {
    if (!formData.customer) return showAlert('Vui lòng nhập tên khách hàng!');
    const dataToSave = {
      ...formData,
      seller: formData.seller || profile?.full_name || profile?.name || profile?.email || ''
    };
    if (editingId !== null) {
      const originalItem = sales.find(i => i.id === editingId);
      const success = await updateRow(editingId, dataToSave);
      if (success && originalItem) {
        addLog('Sửa BC Bán Hàng', `Đã cập nhật thông tin cho "${formData.customer}".`, 'success', 'sales', {
          action: 'edit', tableName: 'sales', previousItem: originalItem, currentItemId: editingId
        });
        resetForm();
      }
    } else {
      const success = await addRow(dataToSave);
      if (success) {
        addLog('Thêm BC Bán Hàng', `Đã thêm báo cáo bán hàng cho "${formData.customer}".`, 'success', 'sales');
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ seller: '', date: new Date().toISOString().split('T')[0], customer: '', address: '', g8: 0, abest_tall: 0, abest_short: 0, sale_price: 0 });
    setIsFormOpen(false);
  };

  const startEdit = (item: DailySaleRow) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev') return showAlert('Bạn không có quyền sửa báo cáo.');
    setEditingId(item.id);
    setFormData(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, customer: string) => {
    if (profile?.role !== 'owner' && profile?.role !== 'dev') return showAlert('Bạn không có quyền xoá báo cáo.');
    const itemToDelete = sales.find(i => i.id === id);
    const confirmed = await showConfirm(`Bạn có chắc chắn muốn xoá báo cáo của "${customer}" không?`);
    if (confirmed) {
      const success = await deleteRow(id);
      if (success && itemToDelete) {
        addLog('Xoá BC Bán Hàng', `Đã xoá báo cáo của "${customer}".`, 'success', 'sales', {
          action: 'delete', tableName: 'sales', previousItem: itemToDelete
        });
      }
    }
  };

  const pagedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage]);

  return (
    <div id="salesPanel" className="tab-panel active">
      <div className="content-card glass p-6">
        <div className="inline-form-head flex justify-between items-center mb-6">
          <h3>Báo cáo bán hàng</h3>
          {(profile?.role === 'owner' || profile?.role === 'dev') && (
            <button className="btn btn-primary btn-sm"
              onClick={() => { setIsFormOpen(!isFormOpen); if (!isFormOpen) setEditingId(null); }}>
              {isFormOpen ? 'Đóng biểu mẫu' : '+ Thêm Hàng Hoá'}
            </button>
          )}
        </div>

        <div className={`form-collapse-container ${!isFormOpen ? 'collapsed' : ''}`}>
          <div className="form-collapse-inner overflow-visible">
            <div className="p-6 bg-slate-50/50 rounded-2xl mb-6">
              <h4 className="font-bold mb-4">{editingId !== null ? `Đang chỉnh sửa: ${formData.customer}` : 'Thêm báo cáo bán hàng mới'}</h4>
              <div className="grid-form">
                <div className="field"><label>Khách hàng</label><input type="text" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} /></div>
                <div className="field"><label>Người bán</label><input type="text" value={formData.seller || (profile?.full_name || profile?.name || profile?.email || '')} onChange={(e) => setFormData({ ...formData, seller: e.target.value })} /></div>
                <div className="field"><label>Ngày</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                <div className="field"><label>Địa chỉ</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="field"><label>G8 Chill</label><input type="number" value={formData.g8} onChange={(e) => setFormData({ ...formData, g8: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Abest Cao</label><input type="number" value={formData.abest_tall} onChange={(e) => setFormData({ ...formData, abest_tall: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field"><label>Abest Lùn</label><input type="number" value={formData.abest_short} onChange={(e) => setFormData({ ...formData, abest_short: parseInt(e.target.value, 10) || 0 })} /></div>
                <div className="field">
                  <label>Giá lẻ</label>
                  <input type="text" placeholder="0đ" value={formData.sale_price ? formatCurrency(formData.sale_price) : ''} onChange={handlePriceInput} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button className="btn btn-outline" onClick={resetForm}>Huỷ bỏ</button>
                <button className="btn btn-primary" onClick={handleSave}>{editingId !== null ? 'Cập nhật báo cáo' : 'Lưu báo cáo'}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Improvement #7: Date range filter */}
        <div className="date-filter-bar">
          <div className="date-filter-group">
            <label>Từ ngày</label>
            <input type="date" className="date-filter-input" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="date-filter-group">
            <label>Đến ngày</label>
            <input type="date" className="date-filter-input" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} />
          </div>
          {(dateFrom || dateTo) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}>
              Xoá lọc
            </button>
          )}
          {(dateFrom || dateTo) && (
            <span className="date-filter-count">Hiển thị {filteredSales.length} / {sales.length} bản ghi</span>
          )}
        </div>

        <div className="table-wrap mt-4">
          <table id="salesTable" className="report-table">
            <thead>
              <tr>
                <th>STT</th><th>Người bán</th><th>Ngày</th><th>Khách hàng</th><th>Địa chỉ</th>
                <th>G8</th><th>Ab.Cao</th><th>Ab.Lùn</th><th>Giá lẻ</th><th>Doanh số</th>
                <th>Giá vốn</th><th>Lợi nhuận</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="salesTableBody" key={currentPage} className="table-animate">
              {/* Improvement #10: Skeleton loading */}
              {loading ? (
                <SkeletonRows cols={13} rows={5} />
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan={13} className="text-center p-10">
                  {(dateFrom || dateTo) ? 'Không có dữ liệu trong khoảng ngày đã chọn.' : 'Chưa có dữ liệu bán lẻ.'}
                </td></tr>
              ) : (
                pagedSales.map((row, index) => {
                  const quantity = (row.g8 || 0) + (row.abest_tall || 0) + (row.abest_short || 0);
                  const revenue = quantity * row.sale_price;
                  // Improvement #3: giá vốn từ context kho
                  const baseCost = (row.g8 || 0) * costs.g8 + (row.abest_tall || 0) * costs.abest_tall + (row.abest_short || 0) * costs.abest_short;
                  const profit = revenue - baseCost;
                  return (
                    <tr key={row.id}>
                      <td className="cell-center">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>{row.seller}</td>
                      <td className="cell-center">{row.date}</td>
                      <td>{row.customer}</td>
                      <td>{row.address}</td>
                      <td className="cell-center">{row.g8 || ''}</td>
                      <td className="cell-center">{row.abest_tall || ''}</td>
                      <td className="cell-center">{row.abest_short || ''}</td>
                      <td className="cell-right">{new Intl.NumberFormat('vi-VN').format(row.sale_price)}</td>
                      <td className="cell-right">{formatCurrency(revenue)}</td>
                      <td className="cell-right">{formatCurrency(baseCost)}</td>
                      <td className="cell-right cell-profit">{formatCurrency(profit)}</td>
                      <td>
                        {(profile?.role === 'owner' || profile?.role === 'dev' || row.created_by === profile?.id) && (
                          <div className="row-actions">
                            <button className="btn btn-warning btn-xs" onClick={() => startEdit(row)}>Sửa</button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(row.id, row.customer)}>Xoá</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <TablePagination totalItems={filteredSales.length} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default SalesTable;
