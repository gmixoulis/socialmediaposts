import { useNavigate, NavLink } from "react-router-dom";
import { useAuthStore } from "@/lib/useAuthStore";
import { Heart, PenSquare, LogOut, LogIn, Newspaper } from "lucide-react";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Newspaper className="h-5 w-5 text-primary" />
          <span>SocialPosts</span>
        </NavLink>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`
            }
          >
            Feed
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/liked"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <Heart className="h-3.5 w-3.5" />
                Liked
              </NavLink>

              <NavLink
                to="/new"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <PenSquare className="h-3.5 w-3.5" />
                New Post
              </NavLink>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                {user?.username ?? "Logout"}
              </button>
            </>
          ) : (
            <NavLink
              to="/auth"
              className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
