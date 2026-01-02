import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, GitCompare, Check } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useCompare } from "@/contexts/CompareContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Products() {
  const { data: productsData, isLoading: productsLoading } = trpc.products.list.useQuery({});
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addToCompare, removeFromCompare, isInCompare, compareList } = useCompare();
  const { language, t } = useLanguage();

  const products = productsData?.items || [];
  const filteredProducts = selectedCategory
    ? products.filter((p: typeof products[0]) => {
        const category = categories?.find(c => c.id === p.categoryId);
        return category?.slug === selectedCategory;
      })
    : products;

  useEffect(() => {
    document.title = language === "vi" 
      ? "Sản Phẩm - Dreamweldtech | Máy Hàn, Cắt, Làm Sạch Laser"
      : "Products - Dreamweldtech | Laser Welding, Cutting, Cleaning Machines";
  }, [language]);

  const handleCompareToggle = (product: typeof products[0]) => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare({
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        price: null,
        categoryId: product.categoryId,
      });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              {language === "vi" ? "Sản Phẩm" : "Products"}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4">
              {language === "vi" ? (
                <>Giải Pháp <span className="text-chart-1">Laser</span> Toàn Diện</>
              ) : (
                <>Comprehensive <span className="text-chart-1">Laser</span> Solutions</>
              )}
            </h1>
            <p className="text-lg text-white/80">
              {language === "vi"
                ? "Khám phá các dòng máy hàn, cắt và làm sạch laser công nghệ cao, được thiết kế cho hiệu suất tối ưu và độ bền vượt trội."
                : "Explore our high-tech laser welding, cutting, and cleaning machines, designed for optimal performance and superior durability."}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="bg-secondary/50 py-6 sticky top-16 z-30 border-b">
        <div className="container">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 flex-1">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="flex-shrink-0"
              >
                {language === "vi" ? "Tất Cả" : "All"}
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
            {compareList.length > 0 && (
              <Link href="/compare">
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <GitCompare className="h-4 w-4 mr-2" />
                  {language === "vi" ? `So sánh (${compareList.length})` : `Compare (${compareList.length})`}
                </Button>
              </Link>
            )}
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
                const inCompare = isInCompare(product.id);
                return (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={product.image || "/images/product-laser-welder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.isFeatured === "true" && (
                        <Badge className="absolute top-4 left-4 bg-chart-1">
                          {language === "vi" ? "Nổi Bật" : "Featured"}
                        </Badge>
                      )}
                      {/* Compare Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleCompareToggle(product);
                        }}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                          inCompare
                            ? "bg-primary text-white"
                            : "bg-white/90 text-primary hover:bg-primary hover:text-white"
                        }`}
                        title={inCompare 
                          ? (language === "vi" ? "Xóa khỏi so sánh" : "Remove from compare")
                          : (language === "vi" ? "Thêm vào so sánh" : "Add to compare")}
                      >
                        {inCompare ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <GitCompare className="h-5 w-5" />
                        )}
                      </button>
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
                      <div className="flex gap-2">
                        <Link href={`/products/${product.slug}`} className="flex-1">
                          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                            {language === "vi" ? "Xem Chi Tiết" : "View Details"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {language === "vi" ? "Không tìm thấy sản phẩm nào." : "No products found."}
              </p>
              <Button className="mt-4" onClick={() => setSelectedCategory(null)}>
                {language === "vi" ? "Xem tất cả sản phẩm" : "View all products"}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-heading font-bold text-white uppercase mb-4">
            {language === "vi" ? "Cần Tư Vấn Sản Phẩm?" : "Need Product Consultation?"}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {language === "vi"
              ? "Đội ngũ kỹ thuật của chúng tôi sẵn sàng hỗ trợ bạn lựa chọn giải pháp phù hợp nhất."
              : "Our technical team is ready to help you choose the most suitable solution."}
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90 text-white">
              {language === "vi" ? "Liên Hệ Ngay" : "Contact Us"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
