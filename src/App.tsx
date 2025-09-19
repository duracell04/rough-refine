import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandSprite } from "@/components/BrandSprite";
import { AppHeader } from "@/components/AppHeader";
import Index from "./pages/Index";
import BiSync from "./pages/BiSync";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BrandSprite />
        <div className="flex h-screen flex-col">
          <AppHeader />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/bisync" element={<BiSync />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
