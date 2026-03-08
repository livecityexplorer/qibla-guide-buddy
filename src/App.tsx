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
import ScannerHomePage from "./pages/halal-scanner/ScannerHomePage";
import BarcodeScanPage from "./pages/halal-scanner/BarcodeScanPage";
import SearchPage from "./pages/halal-scanner/SearchPage";
import ProductDetailPage from "./pages/halal-scanner/ProductDetailPage";
import HistoryPage from "./pages/halal-scanner/HistoryPage";
import FavoritesPage from "./pages/halal-scanner/FavoritesPage";
import IngredientsPage from "./pages/halal-scanner/IngredientsPage";
import LearnPage from "./pages/halal-scanner/LearnPage";
import SettingsPage from "./pages/halal-scanner/SettingsPage";
import RamadanPage from "./pages/RamadanPage";
import BoycottScannerPage from "./pages/BoycottScannerPage";
import BoycottScanPage from "./pages/boycott/BoycottScanPage";
import BoycottDirectoryPage from "./pages/boycott/BoycottDirectoryPage";
import BoycottSearchPage from "./pages/boycott/BoycottSearchPage";
import NearbyPage from "./pages/NearbyPage";
import ProfilePage from "./pages/ProfilePage";
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
              <Route path="/halal-scanner" element={<ScannerHomePage />} />
              <Route path="/halal-scanner/scan" element={<BarcodeScanPage />} />
              <Route path="/halal-scanner/search" element={<SearchPage />} />
              <Route path="/halal-scanner/product/:id" element={<ProductDetailPage />} />
              <Route path="/halal-scanner/history" element={<HistoryPage />} />
              <Route path="/halal-scanner/favorites" element={<FavoritesPage />} />
              <Route path="/halal-scanner/ingredients" element={<IngredientsPage />} />
              <Route path="/halal-scanner/learn" element={<LearnPage />} />
              <Route path="/halal-scanner/settings" element={<SettingsPage />} />
              <Route path="/ramadan" element={<RamadanPage />} />
              <Route path="/boycott" element={<BoycottScannerPage />} />
              <Route path="/boycott/scan" element={<BoycottScanPage />} />
              <Route path="/boycott/directory" element={<BoycottDirectoryPage />} />
              <Route path="/boycott/search" element={<BoycottSearchPage />} />
              <Route path="/nearby" element={<NearbyPage />} />
              <Route path="/profile" element={<ProfilePage />} />
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
