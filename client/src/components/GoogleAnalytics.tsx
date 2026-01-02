import { useEffect } from "react";
import { useLocation } from "wouter";

// Google Analytics Measurement ID from environment
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Declare gtag function for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Initialize Google Analytics
export function initGA() {
  if (!GA_MEASUREMENT_ID) {
    console.log("Google Analytics: No measurement ID configured");
    return;
  }

  // Add gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // Configure GA
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send page views manually for SPA
  });

  console.log("Google Analytics initialized:", GA_MEASUREMENT_ID);
}

// Track page view
export function trackPageView(path: string, title?: string) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

// Track custom events
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag("event", eventName, params);
}

// Track form submissions
export function trackFormSubmission(formName: string, success: boolean = true) {
  trackEvent("form_submit", {
    form_name: formName,
    success: success,
  });
}

// Track button clicks
export function trackButtonClick(buttonName: string, location?: string) {
  trackEvent("button_click", {
    button_name: buttonName,
    click_location: location || "unknown",
  });
}

// Track product views
export function trackProductView(productId: string, productName: string) {
  trackEvent("view_item", {
    item_id: productId,
    item_name: productName,
  });
}

// Track job application
export function trackJobApplication(jobId: string, jobTitle: string) {
  trackEvent("job_application", {
    job_id: jobId,
    job_title: jobTitle,
  });
}

// Track contact form
export function trackContactForm(type: string) {
  trackEvent("contact_form", {
    contact_type: type,
  });
}

// Track newsletter signup
export function trackNewsletterSignup() {
  trackEvent("newsletter_signup");
}

// Track file download
export function trackFileDownload(fileName: string, fileType: string) {
  trackEvent("file_download", {
    file_name: fileName,
    file_type: fileType,
  });
}

// Track search
export function trackSearch(searchTerm: string, resultsCount: number) {
  trackEvent("search", {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

// Google Analytics Provider Component
export function GoogleAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return <>{children}</>;
}

// Hook for easy access to tracking functions
export function useAnalytics() {
  return {
    trackPageView,
    trackEvent,
    trackFormSubmission,
    trackButtonClick,
    trackProductView,
    trackJobApplication,
    trackContactForm,
    trackNewsletterSignup,
    trackFileDownload,
    trackSearch,
  };
}

export default GoogleAnalyticsProvider;
