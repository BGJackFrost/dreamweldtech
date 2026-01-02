import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  price: string | null;
  categoryId: number | null;
}

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
  maxItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_KEY = "dreamweldtech-compare";
const MAX_COMPARE_ITEMS = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COMPARE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(compareList));
    }
  }, [compareList]);

  const addToCompare = (product: Product) => {
    if (compareList.length >= MAX_COMPARE_ITEMS) {
      toast.error(`Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm`);
      return;
    }
    if (compareList.some((p) => p.id === product.id)) {
      toast.info("Sản phẩm đã có trong danh sách so sánh");
      return;
    }
    setCompareList((prev) => [...prev, product]);
    toast.success(`Đã thêm "${product.name}" vào danh sách so sánh`);
  };

  const removeFromCompare = (productId: number) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
    toast.info("Đã xóa sản phẩm khỏi danh sách so sánh");
  };

  const clearCompare = () => {
    setCompareList([]);
    toast.info("Đã xóa tất cả sản phẩm khỏi danh sách so sánh");
  };

  const isInCompare = (productId: number) => {
    return compareList.some((p) => p.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        maxItems: MAX_COMPARE_ITEMS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
