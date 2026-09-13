"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Film, Ticket, Shield, LogOut, User, Menu, X, Calendar, MapPin } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDemoLogin = async (role: "USER" | "ADMIN") => {
    try {
      const email = role === "ADMIN" ? "admin@cinebook.com" : "user@cinebook.com";
      const password = role === "ADMIN" ? "AdminPass123!" : "UserPass123!";
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        await fetchUser();
        if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/bookings");
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
                CINEBOOK
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                PREMIUM CINEMA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" ? "text-amber-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              Movies
            </Link>
            <Link
              href="/cinemas"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/cinemas" ? "text-amber-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-500/70" />
              <span>Cinemas</span>
            </Link>
            <Link
              href="/showtimes"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/showtimes" ? "text-amber-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-500/70" />
              <span>Showtimes</span>
            </Link>

            {currentUser && (
              <Link
                href="/bookings"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/bookings" ? "text-amber-400 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Ticket className="w-4 h-4 text-amber-500/70" />
                <span>My Bookings</span>
              </Link>
            )}

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/admin" ? "text-amber-400 bg-amber-500/10 border border-amber-500/30" : "text-amber-300/80 hover:text-amber-300 hover:bg-amber-500/10"
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {!isLoading && (
              <>
                {currentUser ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        {currentUser.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium max-w-[120px] truncate">{currentUser.name}</span>
                      {currentUser.role === "ADMIN" && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDemoLogin("USER")}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-300/90 hover:bg-amber-500/10 transition-colors"
                    >
                      Demo User
                    </button>
                    <button
                      onClick={() => handleDemoLogin("ADMIN")}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-300/90 hover:bg-yellow-500/10 transition-colors"
                    >
                      Demo Admin
                    </button>
                    <Link
                      href="/login"
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-md shadow-amber-500/20 transition-all duration-200"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-slate-950/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Movies
          </Link>
          <Link
            href="/cinemas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Cinemas
          </Link>
          <Link
            href="/showtimes"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Showtimes
          </Link>

          {currentUser ? (
            <>
              <Link
                href="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
              >
                My Bookings
              </Link>
              {currentUser.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-white/5"
                >
                  Admin Console
                </Link>
              )}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-400">{currentUser.name}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm text-red-400 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleDemoLogin("USER");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center text-xs py-2 rounded border border-amber-500/30 text-amber-300"
                >
                  Demo User
                </button>
                <button
                  onClick={() => {
                    handleDemoLogin("ADMIN");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center text-xs py-2 rounded border border-yellow-500/30 text-yellow-300"
                >
                  Demo Admin
                </button>
              </div>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm"
              >
                Sign In / Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
