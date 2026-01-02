import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

// Zalo Icon SVG
const ZaloIcon = () => (
  <svg viewBox="0 0 48 48" className="h-6 w-6" fill="currentColor">
    <path d="M24 0C10.745 0 0 10.745 0 24s10.745 24 24 24 24-10.745 24-24S37.255 0 24 0zm10.843 32.604c-.166.27-.438.438-.743.438H13.9c-.305 0-.577-.168-.743-.438a.86.86 0 0 1 0-.876l3.315-5.424H13.9a.86.86 0 0 1-.743-1.314l10.1-16.552a.86.86 0 0 1 1.486 0l10.1 16.552a.86.86 0 0 1-.743 1.314h-2.572l3.315 5.424a.86.86 0 0 1 0 .876z"/>
  </svg>
);

// Facebook Messenger Icon SVG
const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);

// Phone Icon for Zalo
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
  </svg>
);

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const chatOptions = [
    {
      name: "Zalo",
      icon: <ZaloIcon />,
      color: "bg-blue-500 hover:bg-blue-600",
      url: "https://zalo.me/0123456789", // Replace with actual Zalo number
      description: language === "vi" ? "Chat qua Zalo" : "Chat via Zalo",
    },
    {
      name: "Messenger",
      icon: <MessengerIcon />,
      color: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
      url: "https://m.me/dreamweldtech", // Replace with actual Facebook page
      description: language === "vi" ? "Chat qua Messenger" : "Chat via Messenger",
    },
    {
      name: language === "vi" ? "Gọi Điện" : "Call Us",
      icon: <PhoneIcon />,
      color: "bg-green-500 hover:bg-green-600",
      url: "tel:+84123456789",
      description: language === "vi" ? "Hotline: +84 123 456 789" : "Hotline: +84 123 456 789",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Options */}
      <div
        className={cn(
          "absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {chatOptions.map((option, index) => (
          <a
            key={option.name}
            href={option.url}
            target={option.url.startsWith("tel:") ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg transition-all duration-300",
              option.color,
              isOpen ? "translate-x-0" : "translate-x-full"
            )}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            {option.icon}
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{option.name}</span>
              <span className="text-xs opacity-80">{option.description}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-chart-1 hover:bg-chart-1/90 animate-pulse"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Tooltip when closed */}
      {!isOpen && (
        <div className="absolute bottom-16 right-0 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap animate-bounce">
          {language === "vi" ? "Cần hỗ trợ?" : "Need help?"}
          <div className="absolute -bottom-1 right-5 w-2 h-2 bg-white transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
