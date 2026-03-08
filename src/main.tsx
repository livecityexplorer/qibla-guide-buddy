import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initAdhanService } from "./services/adhanService";

createRoot(document.getElementById("root")!).render(<App />);

// Initialize Adhan scheduling after app loads
initAdhanService();
