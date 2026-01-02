import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, X, Send, User, Loader2, Sparkles, 
  MessageCircle, Phone, Mail, HelpCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Predefined responses for common questions
const FAQ_RESPONSES: Record<string, { vi: string; en: string }> = {
  "giá|price|báo giá|quote|bao nhiêu": {
    vi: "Để nhận báo giá chính xác, vui lòng liên hệ hotline +84 123 456 789 hoặc gửi yêu cầu qua trang Liên hệ. Đội ngũ tư vấn sẽ phản hồi trong vòng 24h.\n\nCác dòng sản phẩm chính:\n• Máy hàn laser: 1000W - 3000W\n• Máy cắt laser: 1500W - 6000W\n• Máy làm sạch laser: 200W - 500W",
    en: "For accurate pricing, please contact our hotline +84 123 456 789 or submit a request through the Contact page. Our team will respond within 24 hours.\n\nMain product lines:\n• Laser welding: 1000W - 3000W\n• Laser cutting: 1500W - 6000W\n• Laser cleaning: 200W - 500W",
  },
  "bảo hành|warranty|guarantee": {
    vi: "Tất cả sản phẩm của Dreamweldtech được bảo hành từ 12-24 tháng tùy dòng máy. Chúng tôi có đội ngũ kỹ thuật hỗ trợ 24/7 trên toàn quốc.",
    en: "All Dreamweldtech products come with 12-24 months warranty depending on the model. We have a 24/7 technical support team nationwide.",
  },
  "giao hàng|delivery|vận chuyển|shipping": {
    vi: "Chúng tôi giao hàng miễn phí toàn quốc cho đơn hàng trên 50 triệu. Thời gian giao hàng từ 3-7 ngày làm việc tùy khu vực.",
    en: "We offer free nationwide delivery for orders over 50 million VND. Delivery time is 3-7 business days depending on location.",
  },
  "máy hàn|welding|hàn laser|1000w|1500w|2000w": {
    vi: "Dòng máy hàn laser fiber của Dreamweldtech:\n\n• Máy Hàn Laser Fiber 1000W - Phù hợp hàn kim loại mỏng, chi tiết nhỏ\n• Máy Hàn Laser Fiber 1500W - Cân bằng hiệu suất và chi phí\n• Máy Hàn Laser Fiber 2000W - Sản xuất công nghiệp quy mô lớn\n\nƯu điểm: Tốc độ hàn nhanh gấp 2-10 lần TIG, mối hàn đẹp, ít biến dạng nhiệt. Xem chi tiết tại /products",
    en: "Dreamweldtech fiber laser welding machines:\n\n• Fiber Laser Welder 1000W - For thin metals, small parts\n• Fiber Laser Welder 1500W - Balance of performance and cost\n• Fiber Laser Welder 2000W - Large-scale industrial production\n\nAdvantages: 2-10x faster than TIG, beautiful welds, minimal heat distortion. See details at /products",
  },
  "máy cắt|cutting|cắt laser|3000w|6000w": {
    vi: "Dòng máy cắt laser fiber của Dreamweldtech:\n\n• Máy Cắt Laser Fiber 1500W - Cắt kim loại mỏng đến 8mm\n• Máy Cắt Laser Fiber 3000W - Cắt thép dày đến 16mm\n• Máy Cắt Laser Fiber 6000W - Công nghiệp nặng, cắt đến 25mm\n\nĐộ chính xác ±0.02mm, tốc độ cắt đến 80m/phút. Xem chi tiết tại /products",
    en: "Dreamweldtech fiber laser cutting machines:\n\n• Fiber Laser Cutter 1500W - Cuts thin metal up to 8mm\n• Fiber Laser Cutter 3000W - Cuts steel up to 16mm\n• Fiber Laser Cutter 6000W - Heavy industry, cuts up to 25mm\n\nPrecision ±0.02mm, cutting speed up to 80m/min. See details at /products",
  },
  "làm sạch|cleaning|vệ sinh|rỉ sét|tẩy sơn": {
    vi: "Dòng máy làm sạch laser của Dreamweldtech:\n\n• Máy Làm Sạch Laser 200W - Cầm tay linh hoạt, đầu súng chỉ 1.2kg\n• Máy Làm Sạch Laser 500W - Công nghiệp, năng suất cao\n\nƯu điểm: Không hóa chất, thân thiện môi trường, loại bỏ rỉ sét/sơn/dầu mỡ mà không hư hại bề mặt. Xem chi tiết tại /products",
    en: "Dreamweldtech laser cleaning machines:\n\n• Laser Cleaner 200W - Handheld, flexible, gun head only 1.2kg\n• Laser Cleaner 500W - Industrial, high productivity\n\nAdvantages: Chemical-free, eco-friendly, removes rust/paint/grease without damaging surface. See details at /products",
  },
  "liên hệ|contact|tư vấn|consult|địa chỉ|hotline": {
    vi: "Bạn có thể liên hệ với chúng tôi qua:\n📞 Hotline: +84 123 456 789\n📧 Email: contact@dreamweldtech.com\n📍 Địa chỉ: Khu Công Nghiệp, TP. Hồ Chí Minh\n\nHoặc điền form liên hệ tại /contact để nhận tư vấn miễn phí!",
    en: "You can contact us via:\n📞 Hotline: +84 123 456 789\n📧 Email: contact@dreamweldtech.com\n📍 Address: Industrial Park, Ho Chi Minh City\n\nOr fill out the contact form at /contact for free consultation!",
  },
  "xin chào|hello|hi|chào|alo": {
    vi: "Xin chào! 👋 Tôi là trợ lý AI của Dreamweldtech. Tôi có thể giúp bạn:\n\n• Tìm hiểu về máy hàn, cắt, làm sạch laser\n• Báo giá và tư vấn sản phẩm\n• Thông tin bảo hành và hỗ trợ kỹ thuật\n• Thông tin tuyển dụng\n\nBạn cần hỗ trợ gì?",
    en: "Hello! 👋 I'm Dreamweldtech's AI assistant. I can help you with:\n\n• Learn about laser welding, cutting, cleaning machines\n• Pricing and product consultation\n• Warranty and technical support info\n• Career opportunities\n\nHow can I assist you?",
  },
  "sản phẩm|product|thiết bị|máy laser": {
    vi: "Dreamweldtech cung cấp 3 dòng sản phẩm chính:\n\n1️⃣ Máy Hàn Laser (1000W-3000W)\n2️⃣ Máy Cắt Laser (1500W-6000W)\n3️⃣ Máy Làm Sạch Laser (200W-500W)\n4️⃣ Phụ Kiện & Vật Tư\n\nBạn quan tâm đến dòng sản phẩm nào? Xem tất cả tại /products",
    en: "Dreamweldtech offers 3 main product lines:\n\n1️⃣ Laser Welding Machines (1000W-3000W)\n2️⃣ Laser Cutting Machines (1500W-6000W)\n3️⃣ Laser Cleaning Machines (200W-500W)\n4️⃣ Accessories & Consumables\n\nWhich product line interests you? See all at /products",
  },
  "phụ kiện|vật tư|linh kiện|dây hàn|wobble": {
    vi: "Chúng tôi cung cấp đầy đủ phụ kiện và vật tư tiêu hao:\n\n• Đầu Hàn Wobble - Tăng độ rộng mối hàn\n• Dây Hàn Inox 308L - Chất lượng cao\n• Kính bảo hộ laser\n• Linh kiện thay thế chính hãng\n\nXem chi tiết tại /products",
    en: "We provide complete accessories and consumables:\n\n• Wobble Welding Head - Increases weld width\n• 308L Stainless Steel Wire - High quality\n• Laser safety glasses\n• Genuine replacement parts\n\nSee details at /products",
  },
  "tuyển dụng|việc làm|career|job|ứng tuyển": {
    vi: "Dreamweldtech đang tuyển dụng nhiều vị trí:\n\n• Kỹ sư Cơ khí - Lương 15-25 triệu\n• Kỹ sư Tự động hóa - Lương 18-30 triệu\n• Nhân viên Kinh doanh B2B - Lương 12-20 triệu + hoa hồng\n• Kỹ thuật viên Bảo trì\n• Thực tập sinh Kỹ thuật\n\nXem chi tiết và ứng tuyển tại /careers",
    en: "Dreamweldtech is hiring for multiple positions:\n\n• Mechanical Engineer - Salary 15-25M VND\n• Automation Engineer - Salary 18-30M VND\n• B2B Sales Executive - Salary 12-20M VND + commission\n• Maintenance Technician\n• Technical Intern\n\nSee details and apply at /careers",
  },
  "về chúng tôi|about|giới thiệu|công ty|dreamweldtech": {
    vi: "Dreamweldtech là công ty hàng đầu Việt Nam về giải pháp công nghệ laser công nghiệp:\n\n• Hơn 15 năm kinh nghiệm\n• 500+ dự án thành công\n• 10+ đối tác lớn (Toyota, Samsung, Vinfast, Honda...)\n• Đội ngũ kỹ thuật hỗ trợ 24/7\n\nXem thêm tại /about",
    en: "Dreamweldtech is Vietnam's leading industrial laser technology company:\n\n• Over 15 years of experience\n• 500+ successful projects\n• 10+ major partners (Toyota, Samsung, Vinfast, Honda...)\n• 24/7 technical support team\n\nLearn more at /about",
  },
  "cảm ơn|thank|thanks": {
    vi: "Không có gì! Rất vui được hỗ trợ bạn. Nếu có thêm câu hỏi, đừng ngại liên hệ nhé! 😊",
    en: "You're welcome! Happy to help. If you have more questions, don't hesitate to ask! 😊",
  },
};

const QUICK_QUESTIONS: Record<string, string[]> = {
  vi: [
    "Báo giá máy hàn laser",
    "Chính sách bảo hành",
    "Thời gian giao hàng",
    "Liên hệ tư vấn",
  ],
  en: [
    "Laser welder pricing",
    "Warranty policy",
    "Delivery time",
    "Contact for consultation",
  ],
  ja: [
    "レーザー溶接機の見積もり",
    "保証ポリシー",
    "納期",
    "お問い合わせ",
  ],
  zh: [
    "激光焊接机报价",
    "保修政策",
    "交货时间",
    "咨询联系",
  ],
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: language === "vi"
          ? "Xin chào! 👋 Tôi là trợ lý ảo của Dreamweldtech. Tôi có thể giúp bạn tìm hiểu về sản phẩm, báo giá, bảo hành và các dịch vụ của chúng tôi. Bạn cần hỗ trợ gì?"
          : "Hello! 👋 I'm Dreamweldtech's virtual assistant. I can help you learn about our products, pricing, warranty, and services. How can I assist you?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, language]);

  const findResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    for (const [keywords, responses] of Object.entries(FAQ_RESPONSES)) {
      const keywordList = keywords.split("|");
      if (keywordList.some(keyword => lowerQuery.includes(keyword))) {
        return language === "vi" ? responses.vi : responses.en;
      }
    }
    
    // Default response
    return language === "vi"
      ? "Cảm ơn bạn đã liên hệ! Câu hỏi của bạn cần được tư vấn chi tiết hơn. Vui lòng gọi hotline 1900 1234 hoặc để lại thông tin, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất."
      : "Thank you for reaching out! Your question requires more detailed consultation. Please call our hotline 1900 1234 or leave your information, and we'll contact you as soon as possible.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = findResponse(input);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-primary to-chart-1 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-0 overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-primary to-chart-1 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot className="h-6 w-6" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        {language === "vi" ? "Trợ Lý AI" : "AI Assistant"}
                      </CardTitle>
                      <p className="text-xs text-white/80">
                        {language === "vi" ? "Trực tuyến" : "Online"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick Questions */}
                {messages.length <= 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "vi" ? "Câu hỏi thường gặp:" : "Quick questions:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_QUESTIONS[language].map((question, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                          onClick={() => handleQuickQuestion(question)}
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t bg-background">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={language === "vi" ? "Nhập tin nhắn..." : "Type a message..."}
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {language === "vi" 
                      ? "Powered by Dreamweldtech AI" 
                      : "Powered by Dreamweldtech AI"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
