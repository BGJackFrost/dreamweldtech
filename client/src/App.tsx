import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
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

// Frontend Pages
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import Contact from "./pages/Contact";

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
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
