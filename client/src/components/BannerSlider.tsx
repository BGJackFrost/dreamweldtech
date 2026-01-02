import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  position: string;
  sortOrder: number | null;
  isActive: string;
}

interface BannerSliderProps {
  autoPlayInterval?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  className?: string;
  fallbackContent?: React.ReactNode;
}

export function BannerSlider({
  autoPlayInterval = 5000,
  showNavigation = true,
  showDots = true,
  className,
  fallbackContent,
}: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch active hero banners
  const { data: banners = [], isLoading } = trpc.banners.list.useQuery();
  
  // Filter only active hero banners
  const heroBanners = banners
    .filter((b: Banner) => b.position === "hero" && b.isActive === "true")
    .sort((a: Banner, b: Banner) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || heroBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroBanners.length, autoPlayInterval]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [heroBanners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [heroBanners.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Show fallback content if no banners
  if (isLoading) {
    return (
      <div className={cn("relative min-h-[600px] bg-primary animate-pulse", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-chart-1 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (heroBanners.length === 0) {
    return fallbackContent ? <>{fallbackContent}</> : null;
  }

  const currentBanner = heroBanners[currentIndex];

  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides */}
      <div className="relative min-h-[600px] md:min-h-[700px]">
        {heroBanners.map((banner: Banner, index: number) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${isMobile && banner.mobileImage ? banner.mobileImage : banner.image})`,
              }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container">
                <div className="max-w-2xl space-y-6">
                  {/* Subtitle/Tagline */}
                  {banner.subtitle && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-chart-1/20 border border-chart-1/30 rounded-sm">
                      <span className="text-chart-1 font-medium tracking-wider text-sm uppercase">
                        {banner.subtitle}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black uppercase leading-none text-primary-foreground">
                    {banner.title}
                  </h1>

                  {/* Description */}
                  {banner.description && (
                    <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed border-l-4 border-chart-1 pl-4">
                      {banner.description}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-4 pt-4">
                    {banner.buttonLink && banner.buttonText && (
                      <Link href={banner.buttonLink}>
                        <Button 
                          size="lg" 
                          className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider group"
                        >
                          {banner.buttonText}
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                    {banner.link && !banner.buttonLink && (
                      <Link href={banner.link}>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-bold uppercase tracking-wider"
                        >
                          Xem Chi Tiết
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showNavigation && heroBanners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm rounded-full transition-all group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm rounded-full transition-all group"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && heroBanners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroBanners.map((_: Banner, index: number) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                index === currentIndex
                  ? "bg-chart-1 w-8"
                  : "bg-primary-foreground/40 hover:bg-primary-foreground/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {heroBanners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/20 z-20">
          <div
            className="h-full bg-chart-1 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / heroBanners.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default BannerSlider;
