import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Products() {
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({});
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products?.filter(p => {
        const category = categories?.find(c => c.id === p.categoryId);
        return category?.slug === selectedCategory;
      })
    : products;

  useEffect(() => {
    document.title = "Sản Phẩm - Dreamweldtech | Máy Hàn, Cắt, Làm Sạch Laser";
  }, []);

  return (
    <>

      {/* Hero Section */}
      <section className="bg-primary text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              Sản Phẩm
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4">
              Giải Pháp <span className="text-chart-1">Laser</span> Toàn Diện
            </h1>
            <p className="text-lg text-white/80">
              Khám phá các dòng máy hàn, cắt và làm sạch laser công nghệ cao, được thiết kế cho hiệu suất tối ưu và độ bền vượt trội.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="bg-secondary/50 py-6 sticky top-16 z-30 border-b">
        <div className="container">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="flex-shrink-0"
            >
              Tất Cả
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
                className="flex-shrink-0"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container">
          {productsLoading ? (
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
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const category = categories?.find(c => c.id === product.categoryId);
                return (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={product.image || "/images/product-laser-welder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.isFeatured === "true" && (
                        <Badge className="absolute top-4 left-4 bg-chart-1">Nổi Bật</Badge>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardContent className="p-6">
                      {category && (
                        <span className="text-xs font-bold text-chart-1 uppercase tracking-wider">
                          {category.name}
                        </span>
                      )}
                      <h3 className="text-xl font-heading font-bold mt-2 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {product.shortDescription}
                      </p>
                      <Link href={`/products/${product.slug}`}>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                          Xem Chi Tiết
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Không tìm thấy sản phẩm nào.</p>
              <Button className="mt-4" onClick={() => setSelectedCategory(null)}>
                Xem tất cả sản phẩm
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-heading font-bold text-white uppercase mb-4">
            Cần Tư Vấn Sản Phẩm?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Đội ngũ kỹ thuật của chúng tôi sẵn sàng hỗ trợ bạn lựa chọn giải pháp phù hợp nhất.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90 text-white">
              Liên Hệ Ngay
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
