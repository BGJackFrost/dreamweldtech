import { useState, useCallback, useMemo } from "react";
import { Search, Globe, FileText, Package, Newspaper, Users, Briefcase, HelpCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

interface SearchResult {
  id: number;
  type: "product" | "news" | "job" | "faq" | "partner" | "page";
  title: string;
  description: string;
  url: string;
  matchedField: string;
  relevance: number;
}

const typeIcons: Record<string, React.ElementType> = {
  product: Package,
  news: Newspaper,
  job: Briefcase,
  faq: HelpCircle,
  partner: Users,
  page: FileText,
};

const typeLabels: Record<string, Record<string, string>> = {
  product: { vi: "Sản phẩm", en: "Product", ja: "製品", zh: "产品" },
  news: { vi: "Tin tức", en: "News", ja: "ニュース", zh: "新闻" },
  job: { vi: "Việc làm", en: "Job", ja: "求人", zh: "工作" },
  faq: { vi: "FAQ", en: "FAQ", ja: "FAQ", zh: "常见问题" },
  partner: { vi: "Đối tác", en: "Partner", ja: "パートナー", zh: "合作伙伴" },
  page: { vi: "Trang", en: "Page", ja: "ページ", zh: "页面" },
};

const placeholderText: Record<string, string> = {
  vi: "Tìm kiếm sản phẩm, tin tức, việc làm...",
  en: "Search products, news, jobs...",
  ja: "製品、ニュース、求人を検索...",
  zh: "搜索产品、新闻、工作...",
};

const noResultsText: Record<string, string> = {
  vi: "Không tìm thấy kết quả",
  en: "No results found",
  ja: "結果が見つかりません",
  zh: "未找到结果",
};

const searchingText: Record<string, string> = {
  vi: "Đang tìm kiếm...",
  en: "Searching...",
  ja: "検索中...",
  zh: "搜索中...",
};

const searchButtonText: Record<string, string> = {
  vi: "Tìm kiếm",
  en: "Search",
  ja: "検索",
  zh: "搜索",
};

interface TranslationSearchProps {
  variant?: "button" | "icon" | "inline";
  className?: string;
}

export function TranslationSearch({ variant = "button", className }: TranslationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { language } = useLanguage();
  const lang = language as "vi" | "en" | "ja" | "zh";

  // Debounce search query
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch search results from multiple sources
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery(
    { limit: 50 },
    { enabled: debouncedQuery.length >= 2 }
  );

  const { data: news, isLoading: newsLoading } = trpc.news.list.useQuery(
    { limit: 50 },
    { enabled: debouncedQuery.length >= 2 }
  );

  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.listActive.useQuery(
    undefined,
    { enabled: debouncedQuery.length >= 2 }
  );

  const { data: faq, isLoading: faqLoading } = trpc.faq.list.useQuery(
    undefined,
    { enabled: debouncedQuery.length >= 2 }
  );

  const { data: partners, isLoading: partnersLoading } = trpc.partners.getAll.useQuery(
    undefined,
    { enabled: debouncedQuery.length >= 2 }
  );

  const isLoading = productsLoading || newsLoading || jobsLoading || faqLoading || partnersLoading;

  // Search and rank results
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = debouncedQuery.toLowerCase();

    // Helper to calculate relevance score
    const calculateRelevance = (text: string, field: string): number => {
      const lowerText = text.toLowerCase();
      if (lowerText === lowerQuery) return 100; // Exact match
      if (lowerText.startsWith(lowerQuery)) return 80; // Starts with
      if (lowerText.includes(lowerQuery)) return 60; // Contains
      
      // Fuzzy match - check if all words are present
      const queryWords = lowerQuery.split(/\s+/);
      const matchedWords = queryWords.filter(word => lowerText.includes(word));
      if (matchedWords.length === queryWords.length) return 50;
      if (matchedWords.length > 0) return 30 * (matchedWords.length / queryWords.length);
      
      return 0;
    };

    // Search products
    if (products?.items) {
      for (const product of products.items) {
        const nameRelevance = calculateRelevance(product.name, "name");
        const descRelevance = product.description ? calculateRelevance(product.description, "description") : 0;
        const maxRelevance = Math.max(nameRelevance, descRelevance);
        
        if (maxRelevance > 0) {
          results.push({
            id: product.id,
            type: "product",
            title: product.name,
            description: product.description?.slice(0, 100) || "",
            url: `/products/${product.slug}`,
            matchedField: nameRelevance >= descRelevance ? "name" : "description",
            relevance: maxRelevance,
          });
        }
      }
    }

    // Search news
    if (news?.items) {
      for (const article of news.items) {
        const titleRelevance = calculateRelevance(article.title, "title");
        const contentRelevance = article.content ? calculateRelevance(article.content, "content") : 0;
        const maxRelevance = Math.max(titleRelevance, contentRelevance);
        
        if (maxRelevance > 0) {
          results.push({
            id: article.id,
            type: "news",
            title: article.title,
            description: article.excerpt?.slice(0, 100) || article.content?.slice(0, 100) || "",
            url: `/news/${article.slug}`,
            matchedField: titleRelevance >= contentRelevance ? "title" : "content",
            relevance: maxRelevance,
          });
        }
      }
    }

    // Search jobs
    if (jobs) {
      for (const job of jobs) {
        const titleRelevance = calculateRelevance(job.title, "title");
        const descRelevance = job.description ? calculateRelevance(job.description, "description") : 0;
        const maxRelevance = Math.max(titleRelevance, descRelevance);
        
        if (maxRelevance > 0) {
          results.push({
            id: job.id,
            type: "job",
            title: job.title,
            description: job.location || job.department || "",
            url: `/careers/${job.slug}`,
            matchedField: titleRelevance >= descRelevance ? "title" : "description",
            relevance: maxRelevance,
          });
        }
      }
    }

    // Search FAQ
    if (faq) {
      for (const item of faq) {
        const questionRelevance = calculateRelevance(item.question, "question");
        const answerRelevance = item.answer ? calculateRelevance(item.answer, "answer") : 0;
        const maxRelevance = Math.max(questionRelevance, answerRelevance);
        
        if (maxRelevance > 0) {
          results.push({
            id: item.id,
            type: "faq",
            title: item.question,
            description: item.answer?.slice(0, 100) || "",
            url: "/faq",
            matchedField: questionRelevance >= answerRelevance ? "question" : "answer",
            relevance: maxRelevance,
          });
        }
      }
    }

    // Search partners
    if (partners) {
      for (const partner of partners) {
        const nameRelevance = calculateRelevance(partner.name, "name");
        const descRelevance = partner.description ? calculateRelevance(partner.description, "description") : 0;
        const maxRelevance = Math.max(nameRelevance, descRelevance);
        
        if (maxRelevance > 0) {
          results.push({
            id: partner.id,
            type: "partner",
            title: partner.name,
            description: partner.description?.slice(0, 100) || "",
            url: "/partners",
            matchedField: nameRelevance >= descRelevance ? "name" : "description",
            relevance: maxRelevance,
          });
        }
      }
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
  }, [debouncedQuery, products, news, jobs, faq, partners]);

  const handleResultClick = () => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
  };

  const renderTrigger = () => {
    switch (variant) {
      case "icon":
        return (
          <Button variant="ghost" size="icon" className={className}>
            <Search className="h-5 w-5" />
          </Button>
        );
      case "inline":
        return (
          <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholderText[lang]}
              className="pl-9 cursor-pointer"
              readOnly
            />
          </div>
        );
      default:
        return (
          <Button variant="outline" className={`gap-2 ${className}`}>
            <Search className="h-4 w-4" />
            {searchButtonText[lang]}
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {searchButtonText[lang]}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholderText[lang]}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px] mt-4">
          {isLoading && debouncedQuery.length >= 2 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
              {searchingText[lang]}
            </div>
          )}

          {!isLoading && debouncedQuery.length >= 2 && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mb-2 opacity-50" />
              {noResultsText[lang]}
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => {
                const Icon = typeIcons[result.type] || FileText;
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.url}
                    onClick={handleResultClick}
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{result.title}</h4>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {typeLabels[result.type][lang]}
                          </Badge>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {debouncedQuery.length < 2 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">
                {lang === "vi" && "Nhập ít nhất 2 ký tự để tìm kiếm"}
                {lang === "en" && "Enter at least 2 characters to search"}
                {lang === "ja" && "検索するには2文字以上入力してください"}
                {lang === "zh" && "请输入至少2个字符进行搜索"}
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default TranslationSearch;
