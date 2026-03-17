import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { FeedPage } from "@/pages/FeedPage";
import { AuthPage } from "@/pages/AuthPage";
import { LikedPostsPage } from "@/pages/LikedPostsPage";
import { NewPostPage } from "@/pages/NewPostPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main>
              <Routes>
                <Route path="/"       element={<FeedPage />} />
                <Route path="/auth"   element={<AuthPage />} />
                <Route path="/liked"  element={<LikedPostsPage />} />
                <Route path="/new"    element={<NewPostPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
