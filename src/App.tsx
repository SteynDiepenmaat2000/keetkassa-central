import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import AddDrink from "./pages/AddDrink";
import AddDrinkSelectDrink from "./pages/AddDrinkSelectDrink";
import AddMultiple from "./pages/AddMultiple";
import AddMultipleSelectMembers from "./pages/AddMultipleSelectMembers";
import Receipt from "./pages/Receipt";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/add-drink" element={<AddDrink />} />
          <Route path="/add-drink/:memberId" element={<AddDrinkSelectDrink />} />
          <Route path="/add-multiple" element={<AddMultiple />} />
          <Route path="/add-multiple/:drinkId" element={<AddMultipleSelectMembers />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/statistics" element={<Statistics />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
