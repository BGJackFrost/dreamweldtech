import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { X, GitCompare, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, maxItems } = useCompare();
  const { language } = useLanguage();

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40"
      >
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {language === "vi" ? "So sánh sản phẩm" : "Compare Products"}
              </span>
              <span className="text-sm text-muted-foreground">
                ({compareList.length}/{maxItems})
              </span>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-center">
              {compareList.map((product) => (
                <div
                  key={product.id}
                  className="relative flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 pr-8"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {product.name}
                  </span>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: maxItems - compareList.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-[150px] h-[50px] border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center"
                >
                  <span className="text-xs text-muted-foreground">
                    {language === "vi" ? "Thêm sản phẩm" : "Add product"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompare}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {language === "vi" ? "Xóa tất cả" : "Clear all"}
              </Button>
              <Link href="/compare">
                <Button size="sm" disabled={compareList.length < 2}>
                  <GitCompare className="h-4 w-4 mr-1" />
                  {language === "vi" ? "So sánh ngay" : "Compare now"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
