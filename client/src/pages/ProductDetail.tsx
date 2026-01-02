import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Download, 
  Play, 
  Send,
  Phone,
  Mail
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: relatedProductsData } = trpc.products.list.useQuery({ limit: 4 });
  const relatedProducts = relatedProductsData?.items || [];

  const [quoteForm, setQuoteForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const submitMutation = trpc.contacts.submit.useMutation({
    onSuccess: () => {
      toast.success("Yêu cầu báo giá đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm.");
      setQuoteForm({ name: "", email: "", phone: "", company: "", message: "" });
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Dreamweldtech`;
    }
  }, [product]);

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.name || !quoteForm.email) {
      toast.error("Vui lòng điền họ tên và email");
      return;
    }
    submitMutation.mutate({
      ...quoteForm,
      productId: product?.id,
      subject: `Yêu cầu báo giá: ${product?.name}`,
      requestType: "quote",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Không tìm thấy sản phẩm</h1>
          <Link href="/products">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = categories?.find(c => c.id === product.categoryId);
  const specifications = product.specifications ? JSON.parse(product.specifications) : {};
  const features = product.features ? JSON.parse(product.features) : [];
  const applications = product.applications ? JSON.parse(product.applications) : [];
  const related = relatedProducts?.filter(p => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 3);

  return (
    <>
      {/* Breadcrumb */}
      <section className="bg-secondary/50 py-4 border-b">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-primary">Trang chủ</Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/products" className="text-muted-foreground hover:text-primary">Sản phẩm</Link>
            <span className="text-muted-foreground">/</span>
            {category && (
              <>
                <Link href={`/products?category=${category.slug}`} className="text-muted-foreground hover:text-primary">
                  {category.name}
                </Link>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <span className="text-primary font-medium">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Hero */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                <img
                  src={product.image || "/images/product-laser-welder.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.isFeatured === "true" && (
                <Badge className="absolute top-4 left-4 bg-chart-1 text-white">Sản Phẩm Nổi Bật</Badge>
              )}
            </div>

            {/* Product Info */}
            <div>
              {category && (
                <span className="text-sm font-bold text-chart-1 uppercase tracking-wider">
                  {category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-heading font-bold mt-2 mb-4 text-primary uppercase">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {product.shortDescription}
              </p>

              {/* Quick Specs */}
              {Object.keys(specifications).length > 0 && (
                <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                  <h3 className="font-heading font-bold mb-3 uppercase text-sm">Thông Số Chính</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(specifications).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground text-sm">{key}:</span>
                        <span className="font-medium text-sm">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90">
                  <Phone className="h-5 w-5 mr-2" />
                  Gọi Ngay: +84 123 456 789
                </Button>
                <Button size="lg" variant="outline">
                  <Mail className="h-5 w-5 mr-2" />
                  Yêu Cầu Báo Giá
                </Button>
              </div>

              {/* Download & Video */}
              <div className="flex gap-4">
                {product.brochureUrl && (
                  <a href={product.brochureUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Tải Brochure
                    </Button>
                  </a>
                )}
                {product.videoUrl && (
                  <a href={product.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Xem Video
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="py-12 bg-secondary/30">
        <div className="container">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-white border-b rounded-none h-auto p-0">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-heading uppercase"
              >
                Mô Tả
              </TabsTrigger>
              <TabsTrigger 
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-heading uppercase"
              >
                Thông Số Kỹ Thuật
              </TabsTrigger>
              <TabsTrigger 
                value="features"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-heading uppercase"
              >
                Tính Năng
              </TabsTrigger>
              <TabsTrigger 
                value="applications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-heading uppercase"
              >
                Ứng Dụng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6 prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: product.description || "<p>Chưa có mô tả chi tiết.</p>" }} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {Object.keys(specifications).length > 0 ? (
                    <table className="w-full">
                      <tbody>
                        {Object.entries(specifications).map(([key, value], index) => (
                          <tr key={key} className={index % 2 === 0 ? "bg-secondary/50" : ""}>
                            <td className="py-3 px-4 font-medium w-1/3">{key}</td>
                            <td className="py-3 px-4">{value as string}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted-foreground">Chưa có thông số kỹ thuật.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {features.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Chưa có thông tin tính năng.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {applications.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applications.map((app: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>{app}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Chưa có thông tin ứng dụng.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Quote Form */}
      <section className="py-16 bg-primary">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-heading font-bold uppercase mb-4">
                Yêu Cầu <span className="text-chart-1">Báo Giá</span>
              </h2>
              <p className="text-white/80 mb-6">
                Điền thông tin bên dưới để nhận báo giá chi tiết cho sản phẩm {product.name}. 
                Đội ngũ tư vấn của chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-chart-1" />
                  <span>Hotline: +84 123 456 789</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-chart-1" />
                  <span>Email: sales@dreamweldtech.com</span>
                </div>
              </div>
            </div>

            <Card className="bg-white">
              <CardContent className="p-6">
                <form onSubmit={handleQuoteSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ Tên *</Label>
                      <Input
                        id="name"
                        value={quoteForm.name}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nguyễn Văn A"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@company.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số Điện Thoại</Label>
                      <Input
                        id="phone"
                        value={quoteForm.phone}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0912 345 678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Công Ty</Label>
                      <Input
                        id="company"
                        value={quoteForm.company}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Tên công ty"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Ghi Chú</Label>
                    <Textarea
                      id="message"
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Yêu cầu cụ thể về sản phẩm, số lượng, thời gian giao hàng..."
                      rows={4}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-chart-1 hover:bg-chart-1/90"
                    disabled={submitMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? "Đang gửi..." : "Gửi Yêu Cầu Báo Giá"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related && related.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold uppercase mb-8 text-center">
              Sản Phẩm <span className="text-chart-1">Liên Quan</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((item) => (
                <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.image || "/images/product-laser-welder.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-heading font-bold mb-2 line-clamp-2">{item.name}</h3>
                    <Link href={`/products/${item.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Xem Chi Tiết
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
