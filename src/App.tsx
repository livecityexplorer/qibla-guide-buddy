import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import PrayerTimesPage from "./pages/PrayerTimesPage";
import QiblaPage from "./pages/QiblaPage";
import QuranPage from "./pages/QuranPage";
import HadithPage from "./pages/HadithPage";
import HalalScannerPage from "./pages/HalalScannerPage";
import RamadanPage from "./pages/RamadanPage";
import BoycottScannerPage from "./pages/BoycottScannerPage";
import NearbyPage from "./pages/NearbyPage";
import NotFound from "./pages/NotFound";
import { QuranPlayerProvider } from "./contexts/QuranPlayerContext";
import QuranMiniPlayer from "./components/QuranMiniPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <QuranPlayerProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/prayer" element={<PrayerTimesPage />} />
              <Route path="/qibla" element={<QiblaPage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/hadith" element={<HadithPage />} />
              <Route path="/scanner" element={<HalalScannerPage />} />
              <Route path="/ramadan" element={<RamadanPage />} />
              <Route path="/boycott" element={<BoycottScannerPage />} />
              <Route path="/nearby" element={<NearbyPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <QuranMiniPlayer />
        </BrowserRouter>
      </QuranPlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
