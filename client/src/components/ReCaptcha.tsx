import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark";
        size?: "compact" | "normal" | "invisible";
      }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

// Get reCAPTCHA site key from environment
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  action?: string;
  invisible?: boolean;
  theme?: "light" | "dark";
}

// Load reCAPTCHA script
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadReCaptchaScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (scriptLoading) {
      return;
    }

    scriptLoading = true;

    window.onRecaptchaLoad = () => {
      scriptLoaded = true;
      scriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=${RECAPTCHA_SITE_KEY ? "explicit" : "explicit"}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

// Invisible reCAPTCHA v3 component
export function ReCaptchaV3({ onVerify, action = "submit" }: { onVerify: (token: string) => void; action?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn("reCAPTCHA site key not configured");
      // Allow form submission without reCAPTCHA in development
      onVerify("development-token");
      return;
    }

    loadReCaptchaScript().then(() => {
      setReady(true);
    });
  }, []);

  const execute = useCallback(async () => {
    if (!RECAPTCHA_SITE_KEY) {
      return "development-token";
    }

    if (!ready) {
      await loadReCaptchaScript();
    }

    return new Promise<string>((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
          onVerify(token);
          resolve(token);
        } catch (error) {
          console.error("reCAPTCHA error:", error);
          resolve("");
        }
      });
    });
  }, [ready, action, onVerify]);

  return { execute, ready };
}

// Checkbox reCAPTCHA v2 component
export function ReCaptchaCheckbox({
  onVerify,
  onExpire,
  onError,
  theme = "light",
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn("reCAPTCHA site key not configured");
      return;
    }

    loadReCaptchaScript().then(() => {
      if (containerRef.current && widgetIdRef.current === null) {
        window.grecaptcha.ready(() => {
          if (containerRef.current) {
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: onVerify,
              "expired-callback": onExpire,
              "error-callback": onError,
              theme,
              size: "normal",
            });
          }
        });
      }
    });

    return () => {
      if (widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch {
          // Ignore reset errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onExpire, onError, theme]);

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null) {
      window.grecaptcha.reset(widgetIdRef.current);
    }
  }, []);

  if (!RECAPTCHA_SITE_KEY) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
        reCAPTCHA chưa được cấu hình. Form sẽ hoạt động bình thường trong môi trường development.
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} />
      <button type="button" onClick={reset} className="hidden">
        Reset
      </button>
    </div>
  );
}

// Hook for using reCAPTCHA in forms
export function useReCaptcha(action: string = "submit") {
  const [token, setToken] = useState<string>("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const verify = useCallback(async () => {
    if (!RECAPTCHA_SITE_KEY) {
      // Allow submission without reCAPTCHA in development
      setToken("development-token");
      setVerified(true);
      return "development-token";
    }

    setLoading(true);
    
    try {
      await loadReCaptchaScript();
      
      return new Promise<string>((resolve) => {
        window.grecaptcha.ready(async () => {
          try {
            const newToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
            setToken(newToken);
            setVerified(true);
            resolve(newToken);
          } catch (error) {
            console.error("reCAPTCHA error:", error);
            resolve("");
          } finally {
            setLoading(false);
          }
        });
      });
    } catch (error) {
      setLoading(false);
      return "";
    }
  }, [action]);

  const reset = useCallback(() => {
    setToken("");
    setVerified(false);
  }, []);

  return {
    token,
    verified,
    loading,
    verify,
    reset,
    isConfigured: !!RECAPTCHA_SITE_KEY,
  };
}

export default ReCaptchaCheckbox;
