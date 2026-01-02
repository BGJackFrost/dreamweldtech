import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Search,
  MapPin,
  Calendar,
  Building2,
  Play,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const categories = [
  { value: "", label: { vi: "Tất cả", en: "All" } },
  { value: "welding", label: { vi: "Hàn Laser", en: "Laser Welding" } },
  { value: "cutting", label: { vi: "Cắt Laser", en: "Laser Cutting" } },
  { value: "cleaning", label: { vi: "Làm Sạch Laser", en: "Laser Cleaning" } },
  { value: "automation", label: { vi: "Tự Động Hóa", en: "Automation" } },
];

export default function Portfolio() {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: portfolioItems = [], isLoading } = trpc.portfolio.list.useQuery({
    category: selectedCategory || undefined,
  });

  useEffect(() => {
    document.title = `${language === "vi" ? "Dự Án Tiêu Biểu" : "Portfolio"} | Dreamweldtech`;
  }, [language]);

  const filteredItems = portfolioItems.filter(item => {
    if (!searchQuery) return true;
    const title = language === "vi" ? item.title : (item.titleEn || item.title);
    const description = language === "vi" ? item.description : (item.descriptionEn || item.description);
    const search = searchQuery.toLowerCase();
    return title.toLowerCase().includes(search) || 
           (description && description.toLowerCase().includes(search)) ||
           (item.client && item.client.toLowerCase().includes(search));
  });

  const getImages = (item: any): string[] => {
    if (!item.images) return [];
    try {
      return JSON.parse(item.images);
    } catch {
      return item.images.split(",").map((s: string) => s.trim());
    }
  };

  const openLightbox = (item: any, index: number) => {
    setSelectedItem(item);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (!selectedItem) return;
    const images = getImages(selectedItem);
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!selectedItem) return;
    const images = getImages(selectedItem);
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground py-20">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            {language === "vi" ? "Dự Án Tiêu Biểu" : "Our Portfolio"}
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            {language === "vi" 
              ? "Khám phá các dự án thành công mà chúng tôi đã triển khai cho khách hàng trên toàn quốc"
              : "Explore successful projects we have delivered for clients nationwide"}
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 border-b sticky top-0 bg-background z-10">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label[language]}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "vi" ? "Tìm kiếm dự án..." : "Search projects..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">{language === "vi" ? "Đang tải..." : "Loading..."}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {language === "vi" ? "Không tìm thấy dự án" : "No Projects Found"}
              </h3>
              <p className="text-muted-foreground">
                {language === "vi" 
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Try changing filters or search keywords"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const images = getImages(item);
                const title = language === "vi" ? item.title : (item.titleEn || item.title);
                const description = language === "vi" ? item.description : (item.descriptionEn || item.description);

                return (
                  <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    {/* Image */}
                    <div className="relative aspect-video overflow-hidden">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onClick={() => openLightbox(item, 0)}
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Overlay with image count */}
                      {images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {images.length}
                        </div>
                      )}

                      {/* Video indicator */}
                      {item.videoUrl && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full">
                          <Play className="h-4 w-4" />
                        </div>
                      )}

                      {/* Featured badge */}
                      {item.isFeatured === "true" && (
                        <Badge className="absolute top-2 left-2 bg-chart-1">
                          {language === "vi" ? "Nổi bật" : "Featured"}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4" onClick={() => openLightbox(item, 0)}>
                      <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-1">{title}</h3>
                      
                      {description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.client && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {item.client}
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        )}
                        {item.completedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.completedDate}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.tags.split(",").slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          {selectedItem && (
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Image */}
              <div className="relative aspect-video">
                {getImages(selectedItem).length > 0 && (
                  <img
                    src={getImages(selectedItem)[lightboxIndex]}
                    alt={selectedItem.title}
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Navigation arrows */}
                {getImages(selectedItem).length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="p-6 bg-background">
                <h3 className="font-heading font-bold text-xl mb-2">
                  {language === "vi" ? selectedItem.title : (selectedItem.titleEn || selectedItem.title)}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === "vi" ? selectedItem.description : (selectedItem.descriptionEn || selectedItem.description)}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {selectedItem.client && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{language === "vi" ? "Khách hàng:" : "Client:"}</span>
                      {selectedItem.client}
                    </div>
                  )}
                  {selectedItem.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{language === "vi" ? "Địa điểm:" : "Location:"}</span>
                      {selectedItem.location}
                    </div>
                  )}
                </div>

                {/* Video */}
                {selectedItem.videoUrl && (
                  <div className="mt-4">
                    <Button asChild>
                      <a href={selectedItem.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="mr-2 h-4 w-4" />
                        {language === "vi" ? "Xem Video" : "Watch Video"}
                      </a>
                    </Button>
                  </div>
                )}

                {/* Image thumbnails */}
                {getImages(selectedItem).length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {getImages(selectedItem).map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                          idx === lightboxIndex ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
