import { useCompare } from "@/contexts/CompareContext";
import { trpc } from "@/lib/trpc";
// Layout is already provided by PublicRouter in App.tsx
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitCompare, X, ArrowLeft, Check, Minus, ShoppingCart, 
  Phone, FileText, Zap, Shield, Settings, Gauge
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

interface ProductSpec {
  key: string;
  label: string;
  labelEn: string;
  icon: React.ElementType;
}

const SPEC_FIELDS: ProductSpec[] = [
  { key: "power", label: "Công suất", labelEn: "Power", icon: Zap },
  { key: "speed", label: "Tốc độ", labelEn: "Speed", icon: Gauge },
  { key: "accuracy", label: "Độ chính xác", labelEn: "Accuracy", icon: Settings },
  { key: "warranty", label: "Bảo hành", labelEn: "Warranty", icon: Shield },
];

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { language, t } = useLanguage();
  const [productDetails, setProductDetails] = useState<Record<number, any>>({});

  // Fetch full product details for each product in compare list
  const productQueries = compareList.map((product) =>
    trpc.products.getBySlug.useQuery({ slug: product.slug })
  );

  useEffect(() => {
    const details: Record<number, any> = {};
    productQueries.forEach((query, index) => {
      if (query.data) {
        details[compareList[index].id] = query.data;
      }
    });
    setProductDetails(details);
  }, [productQueries.map((q) => q.data).join(",")]);

  useEffect(() => {
    document.title = language === "vi" 
      ? "So Sánh Sản Phẩm | Dreamweldtech" 
      : "Compare Products | Dreamweldtech";
  }, [language]);

  // Parse specifications from product
  const parseSpecs = (product: any) => {
    if (!product?.specifications) return {};
    try {
      return typeof product.specifications === "string" 
        ? JSON.parse(product.specifications) 
        : product.specifications;
    } catch {
      return {};
    }
  };

  // Get all unique spec keys from all products
  const getAllSpecKeys = () => {
    const allKeys = new Set<string>();
    Object.values(productDetails).forEach((product: any) => {
      const specs = parseSpecs(product);
      Object.keys(specs).forEach((key) => allKeys.add(key));
    });
    return Array.from(allKeys);
  };

  if (compareList.length === 0) {
    return (
      <>
        <div className="container py-20">
          <div className="max-w-md mx-auto text-center">
            <GitCompare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
            <h1 className="text-2xl font-heading font-bold mb-4">
              {language === "vi" 
                ? "Chưa có sản phẩm để so sánh" 
                : "No products to compare"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {language === "vi"
                ? "Hãy thêm ít nhất 2 sản phẩm vào danh sách so sánh để xem bảng so sánh chi tiết."
                : "Add at least 2 products to the compare list to see the detailed comparison table."}
            </p>
            <Link href="/products">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "vi" ? "Xem sản phẩm" : "View products"}
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const specKeys = getAllSpecKeys();

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-4 px-4 py-1">
                <GitCompare className="w-4 h-4 mr-2" />
                {language === "vi" ? "So sánh sản phẩm" : "Product Comparison"}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">
                {language === "vi" ? "Bảng So Sánh" : "Comparison Table"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {language === "vi"
                  ? `Đang so sánh ${compareList.length} sản phẩm`
                  : `Comparing ${compareList.length} products`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/products">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === "vi" ? "Thêm sản phẩm" : "Add more"}
                </Button>
              </Link>
              <Button variant="destructive" onClick={clearCompare}>
                {language === "vi" ? "Xóa tất cả" : "Clear all"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12">
        <div className="container">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Product Headers */}
              <thead>
                <tr>
                  <th className="p-4 text-left bg-muted/50 border-b w-[200px]">
                    <span className="font-heading font-bold">
                      {language === "vi" ? "Thông số" : "Specification"}
                    </span>
                  </th>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    return (
                      <th key={product.id} className="p-4 text-center bg-muted/50 border-b min-w-[250px]">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(product.id)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-secondary">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                No Image
                              </div>
                            )}
                          </div>
                          <h3 className="font-heading font-bold text-lg mb-2">{product.name}</h3>
                          {details?.price && (
                            <p className="text-primary font-bold text-xl">
                              {details.price}
                            </p>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {/* Category */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-muted/30">
                    {language === "vi" ? "Danh mục" : "Category"}
                  </td>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    return (
                      <td key={product.id} className="p-4 text-center">
                        <Badge variant="secondary">
                          {details?.category?.name || "-"}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>

                {/* Description */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-muted/30">
                    {language === "vi" ? "Mô tả" : "Description"}
                  </td>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    const description = language === "vi" 
                      ? details?.description 
                      : (details?.descriptionEn || details?.description);
                    return (
                      <td key={product.id} className="p-4 text-center text-sm text-muted-foreground">
                        {description ? (
                          <p className="line-clamp-3">{description}</p>
                        ) : (
                          <Minus className="h-4 w-4 mx-auto text-muted-foreground/50" />
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Dynamic Specifications */}
                {specKeys.map((specKey) => (
                  <tr key={specKey} className="border-b">
                    <td className="p-4 font-medium bg-muted/30 capitalize">
                      {specKey.replace(/_/g, " ")}
                    </td>
                    {compareList.map((product) => {
                      const details = productDetails[product.id];
                      const specs = parseSpecs(details);
                      const value = specs[specKey];
                      return (
                        <td key={product.id} className="p-4 text-center">
                          {value ? (
                            <span className="font-medium">{value}</span>
                          ) : (
                            <Minus className="h-4 w-4 mx-auto text-muted-foreground/50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Features */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-muted/30">
                    {language === "vi" ? "Tính năng" : "Features"}
                  </td>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    let features: string[] = [];
                    if (details?.features) {
                      try {
                        features = typeof details.features === "string"
                          ? JSON.parse(details.features)
                          : details.features;
                      } catch {
                        features = [];
                      }
                    }
                    return (
                      <td key={product.id} className="p-4">
                        {features.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {features.slice(0, 5).map((feature, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {features.length > 5 && (
                              <li className="text-muted-foreground">
                                +{features.length - 5} {language === "vi" ? "tính năng khác" : "more features"}
                              </li>
                            )}
                          </ul>
                        ) : (
                          <Minus className="h-4 w-4 mx-auto text-muted-foreground/50" />
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Status */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-muted/30">
                    {language === "vi" ? "Trạng thái" : "Status"}
                  </td>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    return (
                      <td key={product.id} className="p-4 text-center">
                        <Badge variant={details?.isActive === "true" ? "default" : "secondary"}>
                          {details?.isActive === "true" 
                            ? (language === "vi" ? "Còn hàng" : "In Stock")
                            : (language === "vi" ? "Hết hàng" : "Out of Stock")}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-4 font-medium bg-muted/30">
                    {language === "vi" ? "Hành động" : "Actions"}
                  </td>
                  {compareList.map((product) => (
                    <td key={product.id} className="p-4">
                      <div className="flex flex-col gap-2">
                        <Link href={`/products/${product.slug}`}>
                          <Button className="w-full" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            {language === "vi" ? "Xem chi tiết" : "View Details"}
                          </Button>
                        </Link>
                        <Link href="/contact">
                          <Button variant="outline" className="w-full" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            {language === "vi" ? "Yêu cầu báo giá" : "Request Quote"}
                          </Button>
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                {language === "vi" ? "Cần tư vấn thêm?" : "Need more advice?"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {language === "vi"
                  ? "Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp nhất với nhu cầu."
                  : "Our expert team is ready to help you choose the most suitable product for your needs."}
              </p>
              <div className="flex gap-4">
                <Link href="/contact">
                  <Button>
                    {language === "vi" ? "Liên hệ ngay" : "Contact us"}
                  </Button>
                </Link>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  1900 1234
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
