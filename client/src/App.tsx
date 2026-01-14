import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CompareProvider } from "./contexts/CompareContext";
import Layout from "./components/Layout";
import { CompareBar } from "./components/CompareBar";
import Home from "./pages/Home";

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
  </div>
);

// Lazy load Admin Layout and Theme Provider
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminThemeProvider = lazy(() => import("./components/AdminThemeProvider").then(m => ({ default: m.AdminThemeProvider })));

// Lazy load Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminNews = lazy(() => import("./pages/admin/News"));
const NewsForm = lazy(() => import("./pages/admin/NewsForm"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminHomePage = lazy(() => import("./pages/admin/HomePage"));
const AdminNewsletter = lazy(() => import("./pages/admin/Newsletter"));
const AdminFAQ = lazy(() => import("./pages/admin/FAQ"));
const AdminCaseStudies = lazy(() => import("./pages/admin/CaseStudies"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminEmailCampaign = lazy(() => import("./pages/admin/EmailCampaign"));
const AdminJobs = lazy(() => import("./pages/admin/Jobs"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const AdminPortfolio = lazy(() => import("./pages/admin/Portfolio"));
const AdminPartners = lazy(() => import("./pages/admin/Partners"));
const AdminBackup = lazy(() => import("./pages/admin/Backup"));
const AdminSiteSettings = lazy(() => import("./pages/admin/SiteSettings"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const MultiLanguageSettings = lazy(() => import("./pages/admin/MultiLanguageSettings"));
const BulkImportExport = lazy(() => import("./pages/admin/BulkImportExport"));
const ActivityLog = lazy(() => import("./pages/admin/ActivityLog"));
const NotificationCenter = lazy(() => import("./pages/admin/NotificationCenter"));
const PermissionMatrix = lazy(() => import("./pages/admin/PermissionMatrix"));
const TranslationManager = lazy(() => import("./pages/admin/TranslationManager"));
const ServerMonitoring = lazy(() => import("./pages/admin/ServerMonitoring"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const ForgotPassword = lazy(() => import("./pages/admin/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const TwoFactorSetup = lazy(() => import("./pages/admin/TwoFactorSetup"));
const SessionManagement = lazy(() => import("./pages/admin/SessionManagement"));
const SecuritySettings = lazy(() => import("./pages/admin/SecuritySettings"));
const ChangePassword = lazy(() => import("./pages/admin/ChangePassword"));
const SecurityScore = lazy(() => import("./pages/admin/SecurityScore"));
const IpAccessControl = lazy(() => import("./pages/admin/IpAccessControl"));
const AuditLog = lazy(() => import("./pages/admin/AuditLog"));
const AccessHistory = lazy(() => import("./pages/admin/AccessHistory"));
const GeoBlocking = lazy(() => import("./pages/admin/GeoBlocking"));
const SecurityDashboard = lazy(() => import("./pages/admin/SecurityDashboard"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const AccessDenied = lazy(() => import("./pages/admin/AccessDenied"));

// Frontend Pages (keep some critical pages non-lazy for better initial load)
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import Contact from "./pages/Contact";

// Lazy load less critical frontend pages
const FAQPage = lazy(() => import("./pages/FAQ"));
const ComparePage = lazy(() => import("./pages/Compare"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const CaseStudyDetail = lazy(() => import("./pages/CaseStudyDetail"));
const Careers = lazy(() => import("./pages/Careers"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PortfolioDetail = lazy(() => import("./pages/PortfolioDetail"));
const Partners = lazy(() => import("./pages/Partners"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

import { GoogleAnalyticsProvider } from "./components/GoogleAnalytics";
import { NotificationProvider } from "./components/NotificationProvider";

function PublicRouter() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/products" component={Products} />
            <Route path="/products/:slug" component={ProductDetail} />
            <Route path="/solutions" component={Solutions} />
            <Route path="/news" component={News} />
            <Route path="/news/:slug" component={NewsDetail} />
            <Route path="/contact" component={Contact} />
            <Route path="/faq" component={FAQPage} />
            <Route path="/compare" component={ComparePage} />
            <Route path="/case-studies" component={CaseStudies} />
            <Route path="/case-studies/:slug" component={CaseStudyDetail} />
            <Route path="/careers" component={Careers} />
            <Route path="/careers/:slug" component={JobDetail} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/portfolio/:slug" component={PortfolioDetail} />
            <Route path="/partners" component={Partners} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminThemeProvider>
        <AdminLayout>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/products" component={AdminProducts} />
              <Route path="/admin/products/new" component={ProductForm} />
              <Route path="/admin/products/:id" component={ProductForm} />
              <Route path="/admin/categories" component={AdminCategories} />
              <Route path="/admin/news" component={AdminNews} />
              <Route path="/admin/news/new" component={NewsForm} />
              <Route path="/admin/news/:id" component={NewsForm} />
              <Route path="/admin/contacts" component={AdminContacts} />
              <Route path="/admin/settings" component={AdminSettings} />
              <Route path="/admin/homepage" component={AdminHomePage} />
              <Route path="/admin/newsletter" component={AdminNewsletter} />
              <Route path="/admin/faq" component={AdminFAQ} />
              <Route path="/admin/case-studies" component={AdminCaseStudies} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/reports" component={AdminReports} />
              <Route path="/admin/email-campaign" component={AdminEmailCampaign} />
              <Route path="/admin/jobs" component={AdminJobs} />
              <Route path="/admin/applications" component={AdminApplications} />
              <Route path="/admin/portfolio" component={AdminPortfolio} />
              <Route path="/admin/partners" component={AdminPartners} />
              <Route path="/admin/backup" component={AdminBackup} />
              <Route path="/admin/site-settings" component={AdminSiteSettings} />
              <Route path="/admin/banners" component={AdminBanners} />
              <Route path="/admin/multi-language-settings" component={MultiLanguageSettings} />
              <Route path="/admin/bulk-import-export" component={BulkImportExport} />
              <Route path="/admin/activity-log" component={ActivityLog} />
              <Route path="/admin/notification-center" component={NotificationCenter} />
              <Route path="/admin/permission-matrix" component={PermissionMatrix} />
              <Route path="/admin/translations" component={TranslationManager} />
              <Route path="/admin/monitoring" component={ServerMonitoring} />
              <Route path="/admin/security/2fa" component={TwoFactorSetup} />
              <Route path="/admin/security/sessions" component={SessionManagement} />
              <Route path="/admin/security/settings" component={SecuritySettings} />
              <Route path="/admin/security/change-password" component={ChangePassword} />
              <Route path="/admin/security/history" component={AccessHistory} />
              <Route path="/admin/security/ip-control" component={IpAccessControl} />
              <Route path="/admin/security/audit-log" component={AuditLog} />
              <Route path="/admin/security/geo-blocking" component={GeoBlocking} />
              <Route path="/admin/security/dashboard" component={SecurityDashboard} />
              <Route path="/admin/security/score" component={SecurityScore} />
              <Route path="/admin/roles" component={RoleManagement} />
              <Route component={NotFound} />
          </Switch>
          </Suspense>
        </AdminLayout>
      </AdminThemeProvider>
    </Suspense>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Admin login - standalone page without AdminLayout */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/forgot-password" component={ForgotPassword} />
        <Route path="/admin/reset-password" component={ResetPassword} />
        <Route path="/admin/access-denied" component={AccessDenied} />
        {/* Admin routes - exact match for /admin */}
        <Route path="/admin" component={AdminRouter} />
        {/* Admin routes - with sub-paths */}
        <Route path="/admin/:rest*" component={AdminRouter} />
        {/* Public routes */}
        <Route component={PublicRouter} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <CompareProvider>
            <GoogleAnalyticsProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                  <CompareBar />
                </TooltipProvider>
              </NotificationProvider>
            </GoogleAnalyticsProvider>
          </CompareProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
