import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessWall } from "@/components/snipez/access-wall";
import { SnipezAccessProvider } from "@/components/snipez/access-provider";
import { AppLayout } from "@/components/snipez/app-layout";
import Filters from "./pages/Filters";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import "./global.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SnipezAccessProvider>
        <Toaster />
        <Sonner richColors theme="dark" />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={
                  <AccessWall>
                    <Index />
                  </AccessWall>
                }
              />
              <Route
                path="/filters"
                element={
                  <AccessWall>
                    <Filters />
                  </AccessWall>
                }
              />
              <Route
                path="/settings"
                element={
                  <AccessWall>
                    <Settings />
                  </AccessWall>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SnipezAccessProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
