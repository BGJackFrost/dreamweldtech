import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Calendar, Eye, Share2, Facebook, Linkedin, Twitter, Link2, Mail, MessageCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewsDetail() {
  const params = useParams<{ slug: string }>();
  const { data: article, isLoading } = trpc.news.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: relatedNewsData } = trpc.news.list.useQuery({ limit: 4 });
  const relatedNews = relatedNewsData?.items || [];
  const [copied, setCopied] = useState(false);

  // SEO: Update document head with meta tags and schema
  useEffect(() => {
    if (article) {
      // Update title
      document.title = `${article.title} | Tin tức - Dreamweldtech`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', article.excerpt || article.title);

      // Open Graph tags
      const ogTags = [
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: article.excerpt || '' },
        { property: 'og:image', content: article.image || '' },
        { property: 'og:url', content: window.location.href },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: 'Dreamweldtech' },
        { property: 'article:published_time', content: article.publishedAt ? new Date(article.publishedAt).toISOString() : '' },
      ];

      ogTags.forEach(tag => {
        let meta = document.querySelector(`meta[property="${tag.property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', tag.property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      });

      // Twitter Card tags
      const twitterTags = [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: article.title },
        { name: 'twitter:description', content: article.excerpt || '' },
        { name: 'twitter:image', content: article.image || '' },
      ];

      twitterTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', tag.name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
      });

      // JSON-LD Schema for Article
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.excerpt || '',
        "image": article.image ? [article.image] : [],
        "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : '',
        "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : '',
        "author": {
          "@type": "Organization",
          "name": "Dreamweldtech",
          "url": "https://dreamweldtech.com"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Dreamweldtech",
          "logo": {
            "@type": "ImageObject",
            "url": "https://dreamweldtech.com/logo.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        }
      };

      // BreadcrumbList Schema
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Trang chủ",
            "item": window.location.origin
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tin tức",
            "item": `${window.location.origin}/news`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
            "item": window.location.href
          }
        ]
      };

      // Remove existing schemas
      document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

      // Add Article schema
      const articleSchemaScript = document.createElement('script');
      articleSchemaScript.type = 'application/ld+json';
      articleSchemaScript.text = JSON.stringify(articleSchema);
      document.head.appendChild(articleSchemaScript);

      // Add Breadcrumb schema
      const breadcrumbSchemaScript = document.createElement('script');
      breadcrumbSchemaScript.type = 'application/ld+json';
      breadcrumbSchemaScript.text = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbSchemaScript);
    }

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    };
  }, [article]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Đã sao chép link bài viết");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép link");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Không tìm thấy bài viết</h1>
          <Link href="/news">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại tin tức
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tags = article.tags ? JSON.parse(article.tags) : [];
  const related = relatedNews.filter((n: typeof relatedNews[0]) => n.id !== article.id).slice(0, 3);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(article.title);

  // Social share URLs
  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareText}`,
    email: `mailto:?subject=${shareText}&body=${encodeURIComponent(`Đọc bài viết tại: ${shareUrl}`)}`,
    zalo: `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`,
  };

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-secondary/50 py-4 border-b">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="text-muted-foreground hover:text-primary">Trang chủ</Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/news" className="text-muted-foreground hover:text-primary">Tin tức</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary font-medium line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </section>

      {/* Article Header */}
      <article className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <header>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {article.category && (
                  <Badge className="bg-primary">{article.category}</Badge>
                )}
                <time 
                  dateTime={article.publishedAt ? new Date(article.publishedAt).toISOString() : ''}
                  className="text-sm text-muted-foreground flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.publishedAt)}
                </time>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.viewCount || 0} lượt xem
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Featured Image */}
              {article.image && (
                <figure className="rounded-lg overflow-hidden mb-8">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-auto"
                    loading="eager"
                  />
                </figure>
              )}
            </header>
          </div>
        </div>

        {/* Article Content */}
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="prose prose-lg max-w-none prose-headings:font-heading prose-a:text-primary">
                  <div dangerouslySetInnerHTML={{ __html: article.content || "<p>Nội dung đang được cập nhật...</p>" }} />
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <h4 className="font-heading font-bold mb-4">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Section - Enhanced */}
                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-heading font-bold mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Chia sẻ bài viết
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chia sẻ trên Facebook"
                      className="transition-transform hover:scale-110"
                    >
                      <Button variant="outline" size="icon" className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-none">
                        <Facebook className="h-5 w-5" />
                      </Button>
                    </a>
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chia sẻ trên Twitter"
                      className="transition-transform hover:scale-110"
                    >
                      <Button variant="outline" size="icon" className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white border-none">
                        <Twitter className="h-5 w-5" />
                      </Button>
                    </a>
                    <a
                      href={socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chia sẻ trên LinkedIn"
                      className="transition-transform hover:scale-110"
                    >
                      <Button variant="outline" size="icon" className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white border-none">
                        <Linkedin className="h-5 w-5" />
                      </Button>
                    </a>
                    <a
                      href={socialLinks.zalo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chia sẻ trên Zalo"
                      className="transition-transform hover:scale-110"
                    >
                      <Button variant="outline" size="icon" className="bg-[#0068FF] hover:bg-[#0068FF]/90 text-white border-none">
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    </a>
                    <a
                      href={socialLinks.email}
                      aria-label="Chia sẻ qua Email"
                      className="transition-transform hover:scale-110"
                    >
                      <Button variant="outline" size="icon" className="bg-gray-600 hover:bg-gray-600/90 text-white border-none">
                        <Mail className="h-5 w-5" />
                      </Button>
                    </a>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={copyToClipboard}
                      aria-label="Sao chép link"
                      className={`transition-transform hover:scale-110 ${copied ? 'bg-green-500 text-white border-none' : ''}`}
                    >
                      <Link2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-heading font-bold mb-4 uppercase text-sm">Liên Hệ Tư Vấn</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Cần tư vấn về sản phẩm? Liên hệ ngay với chúng tôi.
                      </p>
                      <Link href="/contact">
                        <Button className="w-full bg-chart-1 hover:bg-chart-1/90" size="sm">
                          Liên Hệ Ngay
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Quick Share - Sidebar */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-heading font-bold mb-4 uppercase text-sm">Chia Sẻ Nhanh</h4>
                      <div className="flex justify-center gap-2">
                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Facebook className="h-4 w-4 text-[#1877F2]" />
                          </Button>
                        </a>
                        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                          </Button>
                        </a>
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {related && related.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold uppercase mb-8 text-center">
              Bài Viết <span className="text-chart-1">Liên Quan</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {related.map((item) => (
                <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={item.image || "/images/hero-banner.jpg"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-4">
                    <time 
                      dateTime={item.publishedAt ? new Date(item.publishedAt).toISOString() : ''}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(item.publishedAt)}
                    </time>
                    <h3 className="font-heading font-bold mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <Link href={`/news/${item.slug}`}>
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        Đọc tiếp
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to News */}
      <section className="py-8">
        <div className="container text-center">
          <Link href="/news">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách tin tức
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
