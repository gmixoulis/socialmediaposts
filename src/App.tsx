import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeedPage } from "@/pages/FeedPage";
import { AuthPage } from "@/pages/AuthPage";
import { LikedPostsPage } from "@/pages/LikedPostsPage";
import { NewPostPage } from "@/pages/NewPostPage";

let qc = new QueryClient({
  defaultOptions: { queries: { retry: 1 } }, // do not retry too much
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main>
              { /* all the routes go here */ }
              <Routes>
                <Route path="/"       element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
                <Route path="/auth"   element={<AuthPage />} />
                <Route path="/liked"  element={<ProtectedRoute><LikedPostsPage /></ProtectedRoute>} />
                <Route path="/new"    element={<ProtectedRoute><NewPostPage /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
