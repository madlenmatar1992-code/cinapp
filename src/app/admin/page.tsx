"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Film,
  Calendar,
  DollarSign,
  Ticket,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";

export default function AdminConsolePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"STATS" | "MOVIES" | "SHOWTIMES" | "MAINTENANCE">("STATS");

  // Stats Data
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Cinema & Movies for forms
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [cinemasList, setCinemasList] = useState<any[]>([]);
  const [genresList, setGenresList] = useState<any[]>([]);

  // Forms State
  const [newMovie, setNewMovie] = useState({
    title: "",
    synopsis: "",
    durationMins: 120,
    releaseDate: "2025-01-01",
    posterUrl: "",
    backdropUrl: "",
    trailerUrl: "",
    rating: "PG-13",
    language: "English",
    genreIds: [] as string[],
  });

  const [newShowtime, setNewShowtime] = useState({
    movieId: "",
    auditoriumId: "",
    startTime: "",
    priceInCents: 1850,
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!data.user || data.user.role !== "ADMIN") {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(data.user);
      await loadAdminData();
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // 1. Stats
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setRecentBookings(data.recentBookings || []);
        setAuditLogs(data.recentAuditLogs || []);
      }

      // 2. Movies
      const moviesRes = await fetch("/api/movies");
      if (moviesRes.ok) {
        const mData = await moviesRes.json();
        setMoviesList(mData.movies || []);
        setGenresList(mData.genres || []);
        if (mData.movies?.length > 0 && !newShowtime.movieId) {
          setNewShowtime((prev) => ({ ...prev, movieId: mData.movies[0].id }));
        }
      }

      // 3. Cinemas
      const cinemasRes = await fetch("/api/cinemas");
      if (cinemasRes.ok) {
        const cData = await cinemasRes.json();
        setCinemasList(cData.cinemas || []);
        if (cData.cinemas?.[0]?.auditoriums?.[0] && !newShowtime.auditoriumId) {
          setNewShowtime((prev) => ({
            ...prev,
            auditoriumId: cData.cinemas[0].auditoriums[0].id,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovie),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create movie");

      setNotification({ type: "success", text: `Movie "${newMovie.title}" created successfully!` });
      setNewMovie({
        title: "",
        synopsis: "",
        durationMins: 120,
        releaseDate: "2025-01-01",
        posterUrl: "",
        backdropUrl: "",
        trailerUrl: "",
        rating: "PG-13",
        language: "English",
        genreIds: [],
      });
      await loadAdminData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShowtime),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to schedule showtime");

      setNotification({
        type: "success",
        text: `Showtime scheduled and ${data.seatsCreated || 80} seats initialized!`,
      });
      await loadAdminData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerHoldRelease = async () => {
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch("/api/cron/release-holds", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to release holds");

      setNotification({
        type: "success",
        text: `Hold Cleanup Triggered: Released ${data.releasedSeatsCount} expired seats across ${data.expiredBookingsCount} expired bookings.`,
      });
      await loadAdminData();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center space-y-4 border border-red-500/30">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400">
            You must be logged in as an Administrator to access the CineBook Admin Console.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Sign In as Demo Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-400">Logged in as {currentUser.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <Shield className="w-7 h-7 text-amber-400" />
              <span>CineBook Operations Management</span>
            </h1>
          </div>

          <button
            onClick={loadAdminData}
            className="p-2 rounded-xl glass-card text-slate-400 hover:text-white border border-white/10 self-start sm:self-auto"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center space-x-2 ${
              notification.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("STATS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === "STATS"
                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                : "glass-card text-slate-400 hover:text-white"
            }`}
          >
            Dashboard KPIs & Activity
          </button>
          <button
            onClick={() => setActiveTab("MOVIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === "MOVIES"
                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                : "glass-card text-slate-400 hover:text-white"
            }`}
          >
            Add & Manage Movies
          </button>
          <button
            onClick={() => setActiveTab("SHOWTIMES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === "SHOWTIMES"
                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                : "glass-card text-slate-400 hover:text-white"
            }`}
          >
            Schedule Showtimes
          </button>
          <button
            onClick={() => setActiveTab("MAINTENANCE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === "MAINTENANCE"
                ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                : "glass-card text-slate-400 hover:text-white"
            }`}
          >
            Seat Holds & Cron
          </button>
        </div>

        {/* TAB 1: KPI STATS & RECENT ACTIVITY */}
        {activeTab === "STATS" && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Gross Box Office</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  ${((stats?.totalRevenueCents || 0) / 100).toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold block">
                  Real verified ticket revenues
                </span>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Tickets Sold</span>
                  <Ticket className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {stats?.ticketsCount || 0} Passes
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Across all active screens
                </span>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Catalog</span>
                  <Film className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {stats?.activeMoviesCount || 0} Titles
                </div>
                <span className="text-[10px] text-cyan-400 font-semibold block">
                  Blockbuster screenings
                </span>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Scheduled Showtimes</span>
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {stats?.showtimesCount || 0} Slots
                </div>
                <span className="text-[10px] text-purple-400 font-semibold block">
                  Today & upcoming days
                </span>
              </div>
            </div>

            {/* Recent Bookings & Audit Logs Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings Table */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-amber-400" />
                  <span>Recent Bookings</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="pb-2">Reference</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500 font-sans">
                            No bookings recorded yet
                          </td>
                        </tr>
                      ) : (
                        recentBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-white/5">
                            <td className="py-2.5 font-bold text-amber-400">{b.referenceCode}</td>
                            <td className="py-2.5 font-sans truncate max-w-[120px]">{b.userEmail}</td>
                            <td className="py-2.5 font-sans">${(b.totalCents / 100).toFixed(2)}</td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold uppercase ${
                                  b.status === "CONFIRMED"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Security & Audit Logs</span>
                </h3>
                <div className="overflow-x-auto max-h-80 overflow-y-auto pr-1">
                  <div className="space-y-2 font-mono text-[11px]">
                    {auditLogs.length === 0 ? (
                      <p className="text-slate-500 text-xs py-4 text-center font-sans">
                        No audit events recorded yet
                      </p>
                    ) : (
                      auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex flex-col space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span className="text-amber-400 font-bold">{log.action}</span>
                            <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <span className="text-slate-300 font-sans truncate text-xs">
                            Entity: {log.entity} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE MOVIE */}
        {activeTab === "MOVIES" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Add New Blockbuster Title</span>
            </h3>

            <form onSubmit={handleCreateMovie} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={newMovie.title}
                    onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                    placeholder="e.g. Gladiator II"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={newMovie.durationMins}
                    onChange={(e) => setNewMovie({ ...newMovie, durationMins: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Synopsis / Storyline</label>
                <textarea
                  required
                  rows={3}
                  value={newMovie.synopsis}
                  onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
                  placeholder="Plot summary of the film..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Release Date</label>
                  <input
                    type="date"
                    required
                    value={newMovie.releaseDate}
                    onChange={(e) => setNewMovie({ ...newMovie, releaseDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Age Rating</label>
                  <select
                    value={newMovie.rating}
                    onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                    <option value="NC-17">NC-17</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Language</label>
                  <input
                    type="text"
                    required
                    value={newMovie.language}
                    onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Poster Image URL</label>
                  <input
                    type="url"
                    required
                    value={newMovie.posterUrl}
                    onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Backdrop Image URL</label>
                  <input
                    type="url"
                    value={newMovie.backdropUrl}
                    onChange={(e) => setNewMovie({ ...newMovie, backdropUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Official Trailer URL (YouTube)</label>
                <input
                  type="url"
                  value={newMovie.trailerUrl}
                  onChange={(e) => setNewMovie({ ...newMovie, trailerUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Genre selection checkboxes */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300 block">Select Genres</span>
                <div className="flex flex-wrap gap-2">
                  {genresList.map((g) => {
                    const isSelected = newMovie.genreIds.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewMovie({
                              ...newMovie,
                              genreIds: newMovie.genreIds.filter((id) => id !== g.id),
                            });
                          } else {
                            setNewMovie({ ...newMovie, genreIds: [...newMovie.genreIds, g.id] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {submitting ? "Saving Movie..." : "Publish Movie to Catalog"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: SCHEDULE SHOWTIME */}
        {activeTab === "SHOWTIMES" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Schedule New Screening & Auto-Initialize Seats</span>
            </h3>

            <form onSubmit={handleCreateShowtime} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Select Movie</label>
                  <select
                    required
                    value={newShowtime.movieId}
                    onChange={(e) => setNewShowtime({ ...newShowtime, movieId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {moviesList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.durationMins}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Auditorium Screen</label>
                  <select
                    required
                    value={newShowtime.auditoriumId}
                    onChange={(e) => setNewShowtime({ ...newShowtime, auditoriumId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {cinemasList.flatMap((c) =>
                      (c.auditoriums || []).map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {c.name} - {a.name} ({a.screenType})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newShowtime.startTime}
                    onChange={(e) => setNewShowtime({ ...newShowtime, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Base Ticket Price (in Minor Cents, e.g. 1850 = $18.50)
                  </label>
                  <input
                    type="number"
                    required
                    value={newShowtime.priceInCents}
                    onChange={(e) => setNewShowtime({ ...newShowtime, priceInCents: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {submitting ? "Scheduling & Generating Seat Grid..." : "Schedule Showtime"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: MAINTENANCE & CRON */}
        {activeTab === "MAINTENANCE" && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Seat Holds & Background Cleanup Job</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Trigger the idempotent hold-release routine that unlocks seats held for more than 10 minutes without verified payment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">
                Production Cron Route:
              </span>
              <code className="text-xs font-mono text-amber-400 bg-slate-950 px-3 py-1.5 rounded-lg block overflow-x-auto">
                POST /api/cron/release-holds (Protected by CRON_SECRET)
              </code>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In Vercel production, this endpoint can be configured via Vercel Cron to run every 5 minutes.
              </p>
            </div>

            <div>
              <button
                disabled={submitting}
                onClick={handleTriggerHoldRelease}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {submitting ? "Scanning & Releasing..." : "Run Expired Hold Cleaner Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
