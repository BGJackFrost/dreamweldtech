import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface GalleryItem {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  title?: string;
}

interface ProductGalleryProps {
  items: GalleryItem[];
  mainImage?: string;
  productName: string;
}

export function ProductGallery({ items, mainImage, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { t } = useLanguage();

  // Combine main image with gallery items
  const allItems: GalleryItem[] = mainImage
    ? [{ type: "image", url: mainImage, title: productName }, ...items]
    : items;

  if (allItems.length === 0) {
    return null;
  }

  const currentItem = allItems[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allItems.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const lightboxPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? allItems.length - 1 : prev - 1));
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev === allItems.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Display */}
      <div className="relative aspect-[4/3] bg-secondary/30 rounded-lg overflow-hidden group">
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={currentItem.title || productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={currentItem.thumbnail || currentItem.url}
              alt={currentItem.title || productName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="rounded-full h-16 w-16 bg-chart-1 hover:bg-chart-1/90"
                  >
                    <Play className="h-8 w-8 text-white fill-white" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0">
                  <VisuallyHidden>
                    <DialogTitle>Video Player</DialogTitle>
                  </VisuallyHidden>
                  <div className="aspect-video">
                    <iframe
                      src={currentItem.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {allItems.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Zoom Button */}
        {currentItem.type === "image" && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => openLightbox(currentIndex)}
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        )}

        {/* Counter */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {allItems.length}
        </div>
      </div>

      {/* Thumbnails */}
      {allItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-chart-1 ring-2 ring-chart-1/30"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <img
                src={item.type === "video" ? (item.thumbnail || item.url) : item.url}
                alt={item.title || `${productName} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </Button>

          {allItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={lightboxPrevious}
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={lightboxNext}
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            </>
          )}

          <div className="max-w-6xl max-h-[90vh] p-4">
            {allItems[lightboxIndex].type === "image" ? (
              <img
                src={allItems[lightboxIndex].url}
                alt={allItems[lightboxIndex].title || productName}
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <div className="aspect-video w-full max-w-4xl">
                <iframe
                  src={allItems[lightboxIndex].url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {allItems.length}
          </div>
        </div>
      )}
    </div>
  );
}
