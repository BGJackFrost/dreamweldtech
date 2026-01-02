import { useParams, Link } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building2, 
  Tag, 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Share2,
  Download
} from "lucide-react";

// Lightbox component for image gallery
function Lightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext 
}: { 
  images: string[]; 
  currentIndex: number; 
  onClose: () => void; 
  onPrev: () => void; 
  onNext: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>
      
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <ChevronRight className="w-8 h-8" />
      </button>
      
      <div className="max-w-5xl max-h-[90vh] px-4" onClick={(e) => e.stopPropagation()}>
        <img 
          src={images[currentIndex]} 
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain mx-auto"
        />
        <div className="text-center text-white mt-4">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

// Video modal component
function VideoModal({ 
  videoUrl, 
  onClose 
}: { 
  videoUrl: string; 
  onClose: () => void;
}) {
  // Convert YouTube/Vimeo URLs to embed format
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    return url;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>
      
      <div className="w-full max-w-4xl aspect-video px-4" onClick={(e) => e.stopPropagation()}>
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function PortfolioDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  const { data: project, isLoading, error } = trpc.portfolio.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: relatedProjects } = trpc.portfolio.list.useQuery(
    { category: project?.category || undefined },
    { enabled: !!project?.category }
  );

  // Parse images from JSON string
  const images: string[] = project?.images ? 
    (typeof project.images === 'string' ? JSON.parse(project.images) : project.images) : 
    [];

  // Parse tags
  const tags: string[] = project?.tags ? project.tags.split(',').map(t => t.trim()) : [];

  // Filter related projects (exclude current)
  const filteredRelated = relatedProjects?.filter(p => p.id !== project?.id).slice(0, 3) || [];

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const prevImage = useCallback(() => {
    setLightboxIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  // SEO meta tags
  useEffect(() => {
    if (project) {
      const title = language === 'vi' ? project.title : (project.titleEn || project.title);
      const description = language === 'vi' ? project.description : (project.descriptionEn || project.description);
      
      document.title = `${title} | Dreamweldtech Portfolio`;
      
      // Meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description?.substring(0, 160) || '');

      // Open Graph
      const ogTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description?.substring(0, 200) || '' },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: window.location.href },
        { property: 'og:image', content: images[0] || '' },
      ];

      ogTags.forEach(({ property, content }) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      });

      // Schema.org structured data
      const schema = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": title,
        "description": description,
        "image": images,
        "dateCreated": project.completedDate,
        "creator": {
          "@type": "Organization",
          "name": "Dreamweldtech"
        },
        "client": project.client,
        "locationCreated": project.location
      };

      let scriptTag = document.querySelector('script[type="application/ld+json"][data-portfolio]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-portfolio', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    }

    return () => {
      const scriptTag = document.querySelector('script[type="application/ld+json"][data-portfolio]');
      if (scriptTag) scriptTag.remove();
    };
  }, [project, language, images]);

  // Share functionality
  const handleShare = async () => {
    const title = language === 'vi' ? project?.title : (project?.titleEn || project?.title);
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Dự án',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép link!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-square" />)}
              </div>
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'vi' ? 'Không tìm thấy dự án' : 'Project not found'}
          </h1>
          <Link href="/portfolio">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Quay lại Portfolio' : 'Back to Portfolio'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = language === 'vi' ? project.title : (project.titleEn || project.title);
  const description = language === 'vi' ? project.description : (project.descriptionEn || project.description);

  return (
    <div className="min-h-screen bg-background">
      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      {/* Video Modal */}
      {videoOpen && project.videoUrl && (
        <VideoModal
          videoUrl={project.videoUrl}
          onClose={() => setVideoOpen(false)}
        />
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-12">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              {language === 'vi' ? 'Trang chủ' : 'Home'}
            </Link>
            <span>/</span>
            <Link href="/portfolio" className="hover:text-primary transition-colors">
              Portfolio
            </Link>
            <span>/</span>
            <span className="text-foreground">{title}</span>
          </nav>

          {/* Back button */}
          <Link href="/portfolio">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Quay lại' : 'Back'}
            </Button>
          </Link>

          {/* Title & Meta */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{title}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                {project.client && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{project.client}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location}</span>
                  </div>
                )}
                {project.completedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{project.completedDate}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Chia sẻ' : 'Share'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gallery */}
            <div className="lg:col-span-2">
              {/* Main Image / Video */}
              <div className="relative aspect-video bg-muted rounded-xl overflow-hidden mb-4 group">
                {images.length > 0 ? (
                  <>
                    <img 
                      src={images[0]} 
                      alt={title}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => openLightbox(0)}
                    />
                    {project.videoUrl && (
                      <button
                        onClick={() => setVideoOpen(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-10 h-10 text-white ml-1" />
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {language === 'vi' ? 'Không có hình ảnh' : 'No images'}
                  </div>
                )}
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-8">
                  {images.slice(0, 6).map((img, index) => (
                    <div 
                      key={index}
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => openLightbox(index)}
                    >
                      <img 
                        src={img} 
                        alt={`${title} ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      {index === 5 && images.length > 6 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">
                          +{images.length - 6}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Video Button (if no images but has video) */}
              {images.length === 0 && project.videoUrl && (
                <Button 
                  size="lg" 
                  className="mb-8"
                  onClick={() => setVideoOpen(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {language === 'vi' ? 'Xem Video Demo' : 'Watch Demo Video'}
                </Button>
              )}

              {/* Description */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <h2 className="text-2xl font-bold mb-4">
                  {language === 'vi' ? 'Mô tả dự án' : 'Project Description'}
                </h2>
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {description || (language === 'vi' ? 'Chưa có mô tả chi tiết.' : 'No detailed description available.')}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {language === 'vi' ? 'Tags' : 'Tags'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {language === 'vi' ? 'Thông tin dự án' : 'Project Info'}
                  </h3>
                  <dl className="space-y-4">
                    {project.category && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          {language === 'vi' ? 'Danh mục' : 'Category'}
                        </dt>
                        <dd className="font-medium">{project.category}</dd>
                      </div>
                    )}
                    {project.client && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          {language === 'vi' ? 'Khách hàng' : 'Client'}
                        </dt>
                        <dd className="font-medium">{project.client}</dd>
                      </div>
                    )}
                    {project.location && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          {language === 'vi' ? 'Địa điểm' : 'Location'}
                        </dt>
                        <dd className="font-medium">{project.location}</dd>
                      </div>
                    )}
                    {project.completedDate && (
                      <div>
                        <dt className="text-sm text-muted-foreground">
                          {language === 'vi' ? 'Hoàn thành' : 'Completed'}
                        </dt>
                        <dd className="font-medium">{project.completedDate}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Video Card */}
              {project.videoUrl && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {language === 'vi' ? 'Video Demo' : 'Demo Video'}
                    </h3>
                    <Button 
                      className="w-full" 
                      onClick={() => setVideoOpen(true)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {language === 'vi' ? 'Xem Video' : 'Watch Video'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* CTA Card */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">
                    {language === 'vi' ? 'Bạn cần dự án tương tự?' : 'Need a similar project?'}
                  </h3>
                  <p className="text-sm opacity-90 mb-4">
                    {language === 'vi' 
                      ? 'Liên hệ với chúng tôi để được tư vấn miễn phí.' 
                      : 'Contact us for a free consultation.'}
                  </p>
                  <Link href="/contact">
                    <Button variant="secondary" className="w-full">
                      {language === 'vi' ? 'Liên hệ ngay' : 'Contact Now'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {filteredRelated.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8">
              {language === 'vi' ? 'Dự án liên quan' : 'Related Projects'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRelated.map((item) => {
                const itemImages: string[] = item.images ? 
                  (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : 
                  [];
                const itemTitle = language === 'vi' ? item.title : (item.titleEn || item.title);
                
                return (
                  <Link key={item.id} href={`/portfolio/${item.slug}`}>
                    <Card className="overflow-hidden group cursor-pointer h-full">
                      <div className="aspect-video bg-muted overflow-hidden">
                        {itemImages[0] ? (
                          <img 
                            src={itemImages[0]} 
                            alt={itemTitle}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {itemTitle}
                        </h3>
                        {item.client && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.client}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
