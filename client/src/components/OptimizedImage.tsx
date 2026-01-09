import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage component with:
 * - Lazy loading (Intersection Observer)
 * - WebP format support with fallback
 * - Blur placeholder while loading
 * - Error handling with fallback image
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Generate WebP URL if possible
  const getWebPUrl = (url: string): string => {
    // If already WebP or external URL, return as is
    if (url.endsWith('.webp') || url.startsWith('http')) {
      return url;
    }
    // For local images, try WebP version
    const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    return webpUrl;
  };

  // Generate srcset for responsive images
  const getSrcSet = (url: string): string => {
    if (url.startsWith('http')) return '';
    
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    const extension = url.match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || '';
    const basePath = url.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    
    return sizes
      .map((size) => `${basePath}-${size}w${extension} ${size}w`)
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Fallback image for errors
  const fallbackSrc = '/images/placeholder.jpg';

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Main image */}
      {isInView && (
        <picture>
          {/* WebP source */}
          <source
            srcSet={getWebPUrl(hasError ? fallbackSrc : src)}
            type="image/webp"
          />
          {/* Original format fallback */}
          <img
            src={hasError ? fallbackSrc : src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              'w-full h-full object-cover'
            )}
          />
        </picture>
      )}

      {/* Loading skeleton when not in view */}
      {!isInView && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Hook for preloading critical images
 */
export function usePreloadImage(src: string) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src]);
}

/**
 * Utility to generate responsive image sizes attribute
 */
export function getImageSizes(breakpoints: { [key: string]: string }): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(min-width: ${breakpoint}) ${size}`)
    .join(', ');
}

export default OptimizedImage;
