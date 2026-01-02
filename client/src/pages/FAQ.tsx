import { trpc } from "@/lib/trpc";
// Layout is already provided by PublicRouter in App.tsx
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, HelpCircle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import NewsletterForm from "@/components/NewsletterForm";

const FAQ_CATEGORIES = [
  { value: "all", labelVi: "Tất Cả", labelEn: "All" },
  { value: "general", labelVi: "Chung", labelEn: "General" },
  { value: "products", labelVi: "Sản Phẩm", labelEn: "Products" },
  { value: "shipping", labelVi: "Vận Chuyển", labelEn: "Shipping" },
  { value: "warranty", labelVi: "Bảo Hành", labelEn: "Warranty" },
  { value: "payment", labelVi: "Thanh Toán", labelEn: "Payment" },
  { value: "support", labelVi: "Hỗ Trợ", labelEn: "Support" },
];

export default function FAQPage() {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: faqs, isLoading } = trpc.faq.list.useQuery(
    selectedCategory === "all" ? undefined : { category: selectedCategory }
  );

  useEffect(() => {
    document.title = language === "vi" 
      ? "Câu Hỏi Thường Gặp | Dreamweldtech" 
      : "FAQ | Dreamweldtech";
  }, [language]);

  const filteredFaqs = faqs?.filter((faq) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const question = language === "vi" ? faq.question : (faq.questionEn || faq.question);
    const answer = language === "vi" ? faq.answer : (faq.answerEn || faq.answer);
    return question.toLowerCase().includes(query) || answer.toLowerCase().includes(query);
  });

  const getCategoryLabel = (value: string) => {
    const cat = FAQ_CATEGORIES.find((c) => c.value === value);
    return language === "vi" ? cat?.labelVi : cat?.labelEn;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1 text-sm font-medium border-primary/30">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {t.faq.title}{" "}
              <span className="text-primary">{t.faq.titleHighlight}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {language === "vi" 
                ? "Tìm câu trả lời cho các thắc mắc phổ biến về sản phẩm và dịch vụ của chúng tôi."
                : "Find answers to common questions about our products and services."}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 border-b">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={language === "vi" ? "Tìm kiếm câu hỏi..." : "Search questions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FAQ_CATEGORIES.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {language === "vi" ? cat.labelVi : cat.labelEn}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFaqs && filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.id}
                    value={`faq-${faq.id}`}
                    className="border rounded-lg px-6 data-[state=open]:bg-primary/5"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="font-medium">
                          {language === "vi" ? faq.question : (faq.questionEn || faq.question)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-12 pb-4 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        {faq.category && (
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(faq.category)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">
                        {language === "vi" ? faq.answer : (faq.answerEn || faq.answer)}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {language === "vi" 
                    ? "Không tìm thấy câu hỏi nào." 
                    : "No questions found."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-heading font-bold mb-4">
                  {language === "vi" 
                    ? "Không tìm thấy câu trả lời?" 
                    : "Can't find an answer?"}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === "vi"
                    ? "Liên hệ với đội ngũ hỗ trợ của chúng tôi để được giải đáp mọi thắc mắc."
                    : "Contact our support team to get answers to all your questions."}
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Hotline:</strong> 1900 1234
                  </p>
                  <p>
                    <strong>Email:</strong> support@dreamweldtech.com
                  </p>
                </div>
              </div>
              <div>
                <NewsletterForm source="faq-page" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
