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
  "giá|price|báo giá|quote": {
    vi: "Để nhận báo giá chính xác, vui lòng liên hệ hotline 1900 1234 hoặc gửi yêu cầu qua trang Liên hệ. Đội ngũ tư vấn sẽ phản hồi trong vòng 24h.",
    en: "For accurate pricing, please contact our hotline 1900 1234 or submit a request through the Contact page. Our team will respond within 24 hours.",
  },
  "bảo hành|warranty|guarantee": {
    vi: "Tất cả sản phẩm của Dreamweldtech được bảo hành từ 12-24 tháng tùy dòng máy. Chúng tôi có đội ngũ kỹ thuật hỗ trợ 24/7 trên toàn quốc.",
    en: "All Dreamweldtech products come with 12-24 months warranty depending on the model. We have a 24/7 technical support team nationwide.",
  },
  "giao hàng|delivery|vận chuyển|shipping": {
    vi: "Chúng tôi giao hàng miễn phí toàn quốc cho đơn hàng trên 50 triệu. Thời gian giao hàng từ 3-7 ngày làm việc tùy khu vực.",
    en: "We offer free nationwide delivery for orders over 50 million VND. Delivery time is 3-7 business days depending on location.",
  },
  "máy hàn|welding|hàn laser": {
    vi: "Máy hàn laser của chúng tôi có công suất từ 1000W đến 3000W, phù hợp cho nhiều loại vật liệu như thép, inox, nhôm. Bạn muốn tìm hiểu dòng máy nào?",
    en: "Our laser welding machines range from 1000W to 3000W, suitable for various materials like steel, stainless steel, and aluminum. Which model are you interested in?",
  },
  "máy cắt|cutting|cắt laser": {
    vi: "Máy cắt laser fiber của Dreamweldtech có độ chính xác cao, tốc độ cắt nhanh và tiết kiệm năng lượng. Phù hợp cho cắt kim loại tấm từ 1-30mm.",
    en: "Dreamweldtech's fiber laser cutting machines offer high precision, fast cutting speed, and energy efficiency. Suitable for cutting metal sheets from 1-30mm.",
  },
  "làm sạch|cleaning|vệ sinh": {
    vi: "Máy làm sạch laser là giải pháp không hóa chất, thân thiện môi trường để loại bỏ gỉ sét, sơn, dầu mỡ trên bề mặt kim loại.",
    en: "Laser cleaning machines are a chemical-free, eco-friendly solution for removing rust, paint, and grease from metal surfaces.",
  },
  "liên hệ|contact|tư vấn|consult": {
    vi: "Bạn có thể liên hệ với chúng tôi qua:\n📞 Hotline: 1900 1234\n📧 Email: contact@dreamweldtech.com\n📍 Địa chỉ: Khu Công Nghệ Cao, Quận 9, TP.HCM",
    en: "You can contact us via:\n📞 Hotline: 1900 1234\n📧 Email: contact@dreamweldtech.com\n📍 Address: High-Tech Park, District 9, HCMC",
  },
  "xin chào|hello|hi|chào": {
    vi: "Xin chào! Tôi là trợ lý ảo của Dreamweldtech. Tôi có thể giúp bạn tìm hiểu về sản phẩm, báo giá, bảo hành và các dịch vụ của chúng tôi. Bạn cần hỗ trợ gì?",
    en: "Hello! I'm Dreamweldtech's virtual assistant. I can help you learn about our products, pricing, warranty, and services. How can I assist you?",
  },
};

const QUICK_QUESTIONS = {
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
