import { useCompare } from "@/contexts/CompareContext";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitCompare, X, ArrowLeft, Check, Minus, 
  Phone, FileText, Zap, Shield, Settings, Gauge,
  Ruler, Weight, Thermometer, Clock, Award, Package,
  Download, Printer, Share2
} from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

interface SpecCategory {
  key: string;
  label: { vi: string; en: string };
  icon: React.ElementType;
  specs: { key: string; label: { vi: string; en: string }; unit?: string }[];
}

// Comprehensive specification categories for laser machines
const SPEC_CATEGORIES: SpecCategory[] = [
  {
    key: "power",
    label: { vi: "Thông số công suất", en: "Power Specifications" },
    icon: Zap,
    specs: [
      { key: "power", label: { vi: "Công suất laser", en: "Laser Power" }, unit: "W" },
      { key: "power_consumption", label: { vi: "Tiêu thụ điện", en: "Power Consumption" }, unit: "kW" },
      { key: "voltage", label: { vi: "Điện áp", en: "Voltage" }, unit: "V" },
      { key: "frequency", label: { vi: "Tần số", en: "Frequency" }, unit: "Hz" },
    ]
  },
  {
    key: "performance",
    label: { vi: "Hiệu suất", en: "Performance" },
    icon: Gauge,
    specs: [
      { key: "speed", label: { vi: "Tốc độ", en: "Speed" } },
      { key: "cutting_speed", label: { vi: "Tốc độ cắt", en: "Cutting Speed" }, unit: "m/min" },
      { key: "welding_speed", label: { vi: "Tốc độ hàn", en: "Welding Speed" }, unit: "mm/s" },
      { key: "accuracy", label: { vi: "Độ chính xác", en: "Accuracy" }, unit: "mm" },
      { key: "repeatability", label: { vi: "Độ lặp lại", en: "Repeatability" }, unit: "mm" },
    ]
  },
  {
    key: "dimensions",
    label: { vi: "Kích thước & Trọng lượng", en: "Dimensions & Weight" },
    icon: Ruler,
    specs: [
      { key: "dimensions", label: { vi: "Kích thước máy", en: "Machine Dimensions" } },
      { key: "working_area", label: { vi: "Vùng làm việc", en: "Working Area" }, unit: "mm" },
      { key: "weight", label: { vi: "Trọng lượng", en: "Weight" }, unit: "kg" },
      { key: "cutting_thickness", label: { vi: "Độ dày cắt tối đa", en: "Max Cutting Thickness" }, unit: "mm" },
      { key: "welding_depth", label: { vi: "Độ sâu hàn", en: "Welding Depth" }, unit: "mm" },
    ]
  },
  {
    key: "materials",
    label: { vi: "Vật liệu hỗ trợ", en: "Supported Materials" },
    icon: Package,
    specs: [
      { key: "materials", label: { vi: "Vật liệu", en: "Materials" } },
      { key: "steel_thickness", label: { vi: "Thép carbon", en: "Carbon Steel" }, unit: "mm" },
      { key: "stainless_thickness", label: { vi: "Thép không gỉ", en: "Stainless Steel" }, unit: "mm" },
      { key: "aluminum_thickness", label: { vi: "Nhôm", en: "Aluminum" }, unit: "mm" },
      { key: "copper_thickness", label: { vi: "Đồng", en: "Copper" }, unit: "mm" },
    ]
  },
  {
    key: "cooling",
    label: { vi: "Hệ thống làm mát", en: "Cooling System" },
    icon: Thermometer,
    specs: [
      { key: "cooling_type", label: { vi: "Loại làm mát", en: "Cooling Type" } },
      { key: "cooling_capacity", label: { vi: "Công suất làm mát", en: "Cooling Capacity" }, unit: "kW" },
      { key: "operating_temp", label: { vi: "Nhiệt độ hoạt động", en: "Operating Temp" }, unit: "°C" },
    ]
  },
  {
    key: "warranty",
    label: { vi: "Bảo hành & Hỗ trợ", en: "Warranty & Support" },
    icon: Shield,
    specs: [
      { key: "warranty", label: { vi: "Thời gian bảo hành", en: "Warranty Period" } },
      { key: "laser_source_warranty", label: { vi: "Bảo hành nguồn laser", en: "Laser Source Warranty" } },
      { key: "support", label: { vi: "Hỗ trợ kỹ thuật", en: "Technical Support" } },
    ]
  },
];

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { language } = useLanguage();
  const [productDetails, setProductDetails] = useState<Record<number, any>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(SPEC_CATEGORIES.map(c => c.key))
  );

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
    
    // Add SEO meta tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", language === "vi"
        ? "So sánh thông số kỹ thuật chi tiết các máy hàn laser, máy cắt laser, máy làm sạch laser của Dreamweldtech"
        : "Compare detailed specifications of Dreamweldtech laser welding, cutting, and cleaning machines"
      );
    }
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

  // Get spec value with formatting
  const getSpecValue = (product: any, specKey: string, unit?: string) => {
    const specs = parseSpecs(product);
    const value = specs[specKey];
    if (!value) return null;
    return unit ? `${value} ${unit}` : value;
  };

  // Check if any product has a specific spec
  const hasAnyProductSpec = (specKey: string) => {
    return Object.values(productDetails).some((product: any) => {
      const specs = parseSpecs(product);
      return specs[specKey] !== undefined && specs[specKey] !== null && specs[specKey] !== "";
    });
  };

  // Toggle category expansion
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  // Export comparison to PDF (print)
  const handlePrint = () => {
    window.print();
    toast.success(language === "vi" ? "Đang in bảng so sánh..." : "Printing comparison...");
  };

  // Share comparison
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === "vi" ? "So sánh sản phẩm Dreamweldtech" : "Dreamweldtech Product Comparison",
          url: url
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(language === "vi" ? "Đã sao chép link!" : "Link copied!");
    }
  };

  // Highlight best value in a row
  const getBestValue = (specKey: string, type: "max" | "min" = "max") => {
    const values: { id: number; value: number }[] = [];
    Object.entries(productDetails).forEach(([id, product]: [string, any]) => {
      const specs = parseSpecs(product);
      const rawValue = specs[specKey];
      if (rawValue) {
        const numValue = parseFloat(String(rawValue).replace(/[^0-9.]/g, ""));
        if (!isNaN(numValue)) {
          values.push({ id: parseInt(id), value: numValue });
        }
      }
    });
    if (values.length < 2) return null;
    return type === "max" 
      ? values.reduce((a, b) => a.value > b.value ? a : b).id
      : values.reduce((a, b) => a.value < b.value ? a : b).id;
  };

  if (compareList.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-12 bg-gradient-to-br from-primary/10 via-background to-background print:bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-4 px-4 py-1 print:hidden">
                <GitCompare className="w-4 h-4 mr-2" />
                {language === "vi" ? "So sánh sản phẩm" : "Product Comparison"}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">
                {language === "vi" ? "Bảng So Sánh Chi Tiết" : "Detailed Comparison Table"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {language === "vi"
                  ? `Đang so sánh ${compareList.length} sản phẩm với thông số kỹ thuật đầy đủ`
                  : `Comparing ${compareList.length} products with full specifications`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                {language === "vi" ? "In" : "Print"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                {language === "vi" ? "Chia sẻ" : "Share"}
              </Button>
              <Link href="/products">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === "vi" ? "Thêm sản phẩm" : "Add more"}
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={clearCompare}>
                {language === "vi" ? "Xóa tất cả" : "Clear all"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-8 print:py-4">
        <div className="container">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse bg-card">
              {/* Product Headers */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-4 text-left w-[220px] font-heading">
                    {language === "vi" ? "Thông số kỹ thuật" : "Specifications"}
                  </th>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    return (
                      <th key={product.id} className="p-4 text-center min-w-[280px]">
                        <div className="relative">
                          <button
                            onClick={() => removeFromCompare(product.id)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80 transition-colors print:hidden"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-white/10">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-contain bg-white"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary-foreground/50">
                                No Image
                              </div>
                            )}
                          </div>
                          <h3 className="font-heading font-bold text-lg">{product.name}</h3>
                          {details?.price && (
                            <p className="text-yellow-300 font-bold text-xl mt-1">
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
                <tr className="border-b bg-muted/30">
                  <td className="p-4 font-medium">
                    {language === "vi" ? "Danh mục" : "Category"}
                  </td>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    return (
                      <td key={product.id} className="p-4 text-center">
                        <Badge variant="secondary" className="text-sm">
                          {details?.category?.name || "-"}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>

                {/* Description */}
                <tr className="border-b">
                  <td className="p-4 font-medium bg-muted/10">
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

                {/* Specification Categories */}
                {SPEC_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isExpanded = expandedCategories.has(category.key);
                  const hasSpecs = category.specs.some(spec => hasAnyProductSpec(spec.key));
                  
                  if (!hasSpecs) return null;

                  return (
                    <React.Fragment key={category.key}>
                      {/* Category Header */}
                      <tr 
                        className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors print:bg-gray-100"
                        onClick={() => toggleCategory(category.key)}
                      >
                        <td colSpan={compareList.length + 1} className="p-3">
                          <div className="flex items-center gap-2 font-heading font-semibold text-primary">
                            <Icon className="h-5 w-5" />
                            {category.label[language as "vi" | "en"]}
                            <span className="ml-auto text-xs text-muted-foreground print:hidden">
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Category Specs */}
                      {isExpanded && category.specs.map((spec) => {
                        if (!hasAnyProductSpec(spec.key)) return null;
                        
                        // Determine best value for highlighting
                        const bestId = ["power", "speed", "cutting_speed", "welding_speed", "working_area"]
                          .includes(spec.key) ? getBestValue(spec.key, "max") 
                          : ["accuracy", "repeatability"].includes(spec.key) ? getBestValue(spec.key, "min")
                          : null;

                        return (
                          <tr key={spec.key} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-4 font-medium text-sm">
                              {spec.label[language as "vi" | "en"]}
                            </td>
                            {compareList.map((product) => {
                              const details = productDetails[product.id];
                              const value = getSpecValue(details, spec.key, spec.unit);
                              const isBest = bestId === product.id;
                              
                              return (
                                <td key={product.id} className="p-4 text-center">
                                  {value ? (
                                    <span className={`font-medium ${isBest ? "text-green-600 bg-green-50 px-2 py-1 rounded" : ""}`}>
                                      {value}
                                      {isBest && <Award className="inline h-4 w-4 ml-1 text-green-600" />}
                                    </span>
                                  ) : (
                                    <Minus className="h-4 w-4 mx-auto text-muted-foreground/50" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {/* Features */}
                <tr className="border-b bg-muted/30">
                  <td className="p-4 font-medium">
                    {language === "vi" ? "Tính năng nổi bật" : "Key Features"}
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
                          <ul className="space-y-1 text-sm text-left">
                            {features.slice(0, 6).map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {features.length > 6 && (
                              <li className="text-muted-foreground text-xs">
                                +{features.length - 6} {language === "vi" ? "tính năng khác" : "more features"}
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
                  <td className="p-4 font-medium bg-muted/10">
                    {language === "vi" ? "Trạng thái" : "Availability"}
                  </td>
                  {compareList.map((product) => {
                    const details = productDetails[product.id];
                    const isActive = details?.isActive === true || details?.isActive === "true";
                    return (
                      <td key={product.id} className="p-4 text-center">
                        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600" : ""}>
                          {isActive 
                            ? (language === "vi" ? "✓ Còn hàng" : "✓ In Stock")
                            : (language === "vi" ? "Hết hàng" : "Out of Stock")}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>

                {/* Actions */}
                <tr className="bg-muted/30 print:hidden">
                  <td className="p-4 font-medium">
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

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground print:hidden">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-green-600" />
              <span>{language === "vi" ? "Giá trị tốt nhất" : "Best value"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="h-4 w-4" />
              <span>{language === "vi" ? "Không có thông tin" : "No data"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 bg-muted/30 print:hidden">
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
                  ? "Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn chọn sản phẩm phù hợp nhất với nhu cầu sản xuất."
                  : "Our expert team is ready to help you choose the most suitable product for your production needs."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <Button>
                    {language === "vi" ? "Liên hệ ngay" : "Contact us"}
                  </Button>
                </Link>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  +84 123 456 789
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:bg-gray-100 { background: #f3f4f6 !important; }
          .print\\:py-4 { padding-top: 1rem; padding-bottom: 1rem; }
          table { font-size: 12px; }
          th, td { padding: 8px !important; }
        }
      `}</style>
    </>
  );
}

// Add React import for Fragment
import React from "react";
