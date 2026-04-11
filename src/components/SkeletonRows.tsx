import React from 'react';

interface SkeletonRowsProps {
  cols: number;
  rows?: number;
}

/**
 * Component hiển thị skeleton loading (#10) thay thế dòng chữ "Đang tải..."
 */
const SkeletonRows: React.FC<SkeletonRowsProps> = ({ cols, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={`skeleton-${i}`} className="skeleton-row">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} style={{ padding: '10px 12px' }}>
            <div className="skeleton-cell" style={{ height: '14px', borderRadius: '6px' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export default SkeletonRows;
