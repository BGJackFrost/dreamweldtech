import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, Newspaper, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function SearchDialog({ trigger, className }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  // Search products
  const { data: productsData, isLoading: productsLoading } = trpc.products.list.useQuery(
    { search: query, limit: 5 },
    { enabled: query.length >= 2 }
  );

  // Search news
  const { data: newsData, isLoading: newsLoading } = trpc.news.list.useQuery(
    { search: query, limit: 5 },
    { enabled: query.length >= 2 }
  );

  const isLoading = productsLoading || newsLoading;
  const hasResults = (productsData?.items?.length || 0) > 0 || (newsData?.items?.length || 0) > 0;

  const handleNavigate = (path: string) => {
    setOpen(false);
    setQuery("");
    setLocation(path);
  };

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className={cn(
              "relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2",
              className
            )}
          >
            <Search className="h-4 w-4 xl:mr-2" />
            <span className="hidden xl:inline-flex">Tìm kiếm...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="sr-only">Tìm kiếm</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm, tin tức..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto px-2 pb-4">
          {query.length < 2 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nhập ít nhất 2 ký tự để tìm kiếm
            </div>
          ) : isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Không tìm thấy kết quả cho "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {/* Products Results */}
              {productsData?.items && productsData.items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5" />
                    Sản phẩm
                  </div>
                  <div className="space-y-1">
                    {productsData.items.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleNavigate(`/products/${product.slug}`)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-left group"
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </p>
                          {product.shortDescription && (
                            <p className="text-xs text-muted-foreground truncate">
                              {product.shortDescription}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* News Results */}
              {newsData?.items && newsData.items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Newspaper className="h-3.5 w-3.5" />
                    Tin tức
                  </div>
                  <div className="space-y-1">
                    {newsData.items.map((news) => (
                      <button
                        key={news.id}
                        onClick={() => handleNavigate(`/news/${news.slug}`)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors text-left group"
                      >
                        {news.image ? (
                          <img
                            src={news.image}
                            alt={news.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                            <Newspaper className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {news.title}
                          </p>
                          {news.excerpt && (
                            <p className="text-xs text-muted-foreground truncate">
                              {news.excerpt}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
