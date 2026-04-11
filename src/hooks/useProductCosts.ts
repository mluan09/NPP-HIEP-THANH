import { useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';

// Giá vốn mặc định nếu không tìm thấy sản phẩm trong kho
const DEFAULT_COSTS = {
  g8: 157000,
  abest_tall: 163000,
  abest_short: 153000,
};

// Từ khoá để nhận dạng sản phẩm trong bảng kho hàng (không phân biệt hoa/thường)
const PRODUCT_KEYWORDS = {
  g8: ['g8', 'g 8'],
  abest_tall: ['abest cao', 'a best cao', 'abest tall'],
  abest_short: ['abest lùn', 'a best lùn', 'abest short', 'abest lun'],
};

/**
 * Hook lấy giá vốn sản phẩm từ bảng kho hàng (Improvement #3).
 * Nếu không tìm thấy sản phẩm phù hợp, dùng giá vốn mặc định.
 */
export function useProductCosts() {
  const { inventory } = useInventory();

  return useMemo(() => {
    const findPrice = (keywords: string[]) => {
      const item = inventory.find(inv =>
        keywords.some(kw => inv.name.toLowerCase().includes(kw))
      );
      return item?.price;
    };

    return {
      g8: findPrice(PRODUCT_KEYWORDS.g8) ?? DEFAULT_COSTS.g8,
      abest_tall: findPrice(PRODUCT_KEYWORDS.abest_tall) ?? DEFAULT_COSTS.abest_tall,
      abest_short: findPrice(PRODUCT_KEYWORDS.abest_short) ?? DEFAULT_COSTS.abest_short,
    };
  }, [inventory]);
}
