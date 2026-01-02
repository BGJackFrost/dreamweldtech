import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CompareProvider } from "./contexts/CompareContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import { CompareBar } from "./components/CompareBar";
import Home from "./pages/Home";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import AdminNews from "./pages/admin/News";
import NewsForm from "./pages/admin/NewsForm";
import AdminContacts from "./pages/admin/Contacts";
import AdminSettings from "./pages/admin/Settings";
import AdminHomePage from "./pages/admin/HomePage";
import AdminNewsletter from "./pages/admin/Newsletter";
import AdminFAQ from "./pages/admin/FAQ";
import AdminCaseStudies from "./pages/admin/CaseStudies";
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminEmailCampaign from "./pages/admin/EmailCampaign";
import AdminJobs from "./pages/admin/Jobs";
import AdminApplications from "./pages/admin/Applications";
import AdminPortfolio from "./pages/admin/Portfolio";
import AdminPartners from "./pages/admin/Partners";
import AdminBackup from "./pages/admin/Backup";
import AdminSiteSettings from "./pages/admin/SiteSettings";

// Frontend Pages
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import Contact from "./pages/Contact";
import FAQPage from "./pages/FAQ";
import ComparePage from "./pages/Compare";
import CaseStudies from "./pages/CaseStudies";
import CaseStudyDetail from "./pages/CaseStudyDetail";
import Careers from "./pages/Careers";
import JobDetail from "./pages/JobDetail";
import Portfolio from "./pages/Portfolio";
import PortfolioDetail from "./pages/PortfolioDetail";
import Partners from "./pages/Partners";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { GoogleAnalyticsProvider } from "./components/GoogleAnalytics";

function PublicRouter() {
  return (
    <Layout>
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
    </Layout>
  );
}

function AdminRouter() {
  return (
    <AdminLayout>
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
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin routes - exact match for /admin */}
      <Route path="/admin" component={AdminRouter} />
      {/* Admin routes - with sub-paths */}
      <Route path="/admin/:rest*" component={AdminRouter} />
      {/* Public routes */}
      <Route component={PublicRouter} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <CompareProvider>
            <GoogleAnalyticsProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                <CompareBar />
              </TooltipProvider>
            </GoogleAnalyticsProvider>
          </CompareProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
