import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsletterFormProps {
  variant?: "default" | "compact" | "footer";
  source?: string;
}

export default function NewsletterForm({ variant = "default", source = "website" }: NewsletterFormProps) {
  const { t } = useLanguage();
  const newsletter = t.newsletter;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsSubscribed(true);
        setEmail("");
        setName("");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error("Có lỗi xảy ra: " + (error as { message: string }).message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email!");
      return;
    }
    subscribeMutation.mutate({ email, name: name || undefined, source });
  };

  if (isSubscribed) {
    return (
      <div className={`flex items-center gap-3 ${variant === "compact" ? "text-sm" : ""}`}>
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-green-600 dark:text-green-400">
          {newsletter.success}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder={newsletter.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" size="sm" disabled={subscribeMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-muted-foreground mb-2">
          {newsletter.description}
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={newsletter.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-background/50"
            required
          />
          <Button type="submit" disabled={subscribeMutation.isPending}>
            {subscribeMutation.isPending ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    );
  }

  // Default variant
  return (
    <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{newsletter.title}</h3>
          <p className="text-sm text-muted-foreground">{newsletter.description}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder={newsletter.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          placeholder={newsletter.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={subscribeMutation.isPending}>
          {subscribeMutation.isPending ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {newsletter.subscribing}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {newsletter.subscribe}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
