import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function News() {
  const { data: newsData, isLoading } = trpc.news.list.useQuery({});
  const news = newsData?.items || [];

  useEffect(() => {
    document.title = "Tin Tức - Dreamweldtech | Cập Nhật Công Nghệ Laser";
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              Tin Tức
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4">
              Cập Nhật <span className="text-chart-1">Công Nghệ</span> Laser
            </h1>
            <p className="text-lg text-white/80">
              Khám phá các xu hướng mới nhất, hướng dẫn kỹ thuật và tin tức từ Dreamweldtech.
            </p>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-16">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-secondary"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-secondary rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-secondary rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <>
              {/* Featured Article */}
              {news[0] && (
                <div className="mb-12">
                  <Card className="overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="h-64 lg:h-auto">
                        <img
                          src={news[0].image || "/images/hero-banner.jpg"}
                          alt={news[0].title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4">
                          {news[0].category && (
                            <Badge variant="outline">{news[0].category}</Badge>
                          )}
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(news[0].publishedAt)}
                          </span>
                        </div>
                        <h2 className="text-2xl font-heading font-bold mb-4 line-clamp-2">
                          {news[0].title}
                        </h2>
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {news[0].excerpt}
                        </p>
                        <Link href={`/news/${news[0].slug}`}>
                          <Button className="w-fit">
                            Đọc Tiếp
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              )}

              {/* Other Articles */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {news.slice(1).map((article) => (
                  <Card key={article.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.image || "/images/hero-banner.jpg"}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {article.category && (
                        <Badge className="absolute top-4 left-4 bg-primary">{article.category}</Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.viewCount || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-heading font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>
                      <Link href={`/news/${article.slug}`}>
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                          Đọc Tiếp
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Chưa có bài viết nào.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-secondary/50 py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-heading font-bold uppercase mb-4">
            Đăng Ký Nhận <span className="text-chart-1">Tin Tức</span>
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Nhận thông tin mới nhất về công nghệ laser và các chương trình khuyến mãi từ Dreamweldtech.
          </p>
          <div className="flex justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="bg-chart-1 hover:bg-chart-1/90">
              Đăng Ký
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
