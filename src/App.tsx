import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { HomePage } from "./components/HomePage";
import { UploadPage } from "./components/UploadPage";
import { DownloadPage } from "./components/DownloadPage";
import { AdminPanel } from "./components/AdminPanel";
import { PreviewPage } from "./components/PreviewPage";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
