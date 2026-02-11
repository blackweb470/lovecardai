import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SectionPublic from "./pages/SectionPublic";
import SectionAdmin from "./pages/SectionAdmin";
import DirectSend from "./pages/DirectSend";
import ViewDirectCard from "./pages/ViewDirectCard";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:slug" element={<SectionPublic />} />
          <Route path="/s/:slug/admin" element={<SectionAdmin />} />
          <Route path="/direct" element={<DirectSend />} />
          <Route path="/view/:token" element={<ViewDirectCard />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
