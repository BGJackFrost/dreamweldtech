import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/about"} component={() => <div className="container py-20">Trang Giới Thiệu đang được xây dựng...</div>} />
        <Route path={"/products"} component={() => <div className="container py-20">Trang Sản Phẩm đang được xây dựng...</div>} />
        <Route path={"/solutions"} component={() => <div className="container py-20">Trang Giải Pháp đang được xây dựng...</div>} />
        <Route path={"/news"} component={() => <div className="container py-20">Trang Tin Tức đang được xây dựng...</div>} />
        <Route path={"/contact"} component={() => <div className="container py-20">Trang Liên Hệ đang được xây dựng...</div>} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
