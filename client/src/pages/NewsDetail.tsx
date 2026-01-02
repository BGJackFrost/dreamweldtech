import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Calendar, Eye, Share2, Facebook, Linkedin, Twitter } from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect } from "react";

export default function NewsDetail() {
  const params = useParams<{ slug: string }>();
  const { data: article, isLoading } = trpc.news.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: relatedNewsData } = trpc.news.list.useQuery({ limit: 4 });
  const relatedNews = relatedNewsData?.items || [];

  useEffect(() => {
    if (article) {
      document.title = `${article.title} - Dreamweldtech`;
    }
  }, [article]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-secondary/50 py-4 border-b">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-primary">Trang chủ</Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/news" className="text-muted-foreground hover:text-primary">Tin tức</Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary font-medium line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </section>

      {/* Article Header */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {article.category && (
                <Badge className="bg-primary">{article.category}</Badge>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(article.publishedAt)}
              </span>
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
              <div className="rounded-lg overflow-hidden mb-8">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <article className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: article.content || "<p>Nội dung đang được cập nhật...</p>" }} />
                </article>

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

                {/* Share */}
                <div className="mt-8 pt-8 border-t">
                  <h4 className="font-heading font-bold mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Chia sẻ bài viết:
                  </h4>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Facebook className="h-5 w-5" />
                      </Button>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Twitter className="h-5 w-5" />
                      </Button>
                    </a>
                    <a
                      href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Linkedin className="h-5 w-5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                    />
                  </div>
                  <CardContent className="p-4">
                    <span className="text-xs text-muted-foreground">{formatDate(item.publishedAt)}</span>
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
