"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ChevronRight,
  Filter,
  Film,
} from "lucide-react";

export default function MasterShowtimesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Generate next 5 dates
  const dateOptions: { label: string; dateStr: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    let label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (i === 0) label = "Today";
    if (i === 1) label = "Tomorrow";
    dateOptions.push({ label, dateStr });
  }

  useEffect(() => {
    setSelectedDate(dateOptions[0].dateStr);
    fetchData();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [selectedCinema, selectedDate]);

  const fetchData = async () => {
    try {
      const cRes = await fetch("/api/cinemas");
      const cData = await cRes.json();
      if (cData.cinemas) setCinemas(cData.cinemas);
      await fetchMovies();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCinema) params.set("cinemaId", selectedCinema);
      if (selectedDate) params.set("date", selectedDate);

      const res = await fetch(`/api/movies?${params.toString()}`);
      const data = await res.json();
      if (data.movies) setMovies(data.movies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
            Daily Schedule
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cinema Showtimes & Screening Formats
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Browse screenings by date and cinema location. Select any showtime to choose your seats.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Date Buttons */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {dateOptions.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedDate === d.dateStr
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Cinema Filter */}
            <div className="w-full sm:w-72">
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                aria-label="Filter by Cinema"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
              >
                <option value="">All Cinema Locations</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Movies & Schedule */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl glass-card animate-pulse border border-white/5"
              />
            ))}
          </div>
        )}

        {!loading && movies.length === 0 && (
          <div className="rounded-2xl glass-card p-12 text-center space-y-3 max-w-md mx-auto border border-white/5">
            <Film className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Showtimes Found</h3>
            <p className="text-xs text-slate-400">
              No screenings match your current date and cinema selection.
            </p>
          </div>
        )}

        {!loading && movies.length > 0 && (
          <div className="space-y-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row gap-6 items-start shadow-xl"
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-24 h-36 sm:w-28 sm:h-40 rounded-2xl object-cover shadow-lg border border-white/10 shrink-0"
                />

                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        {movie.rating}
                      </span>
                      <span className="text-xs text-slate-400">
                        {movie.durationMins} mins • {movie.language}
                      </span>
                    </div>
                    <Link
                      href={`/movies/${movie.id}`}
                      className="text-xl sm:text-2xl font-black text-white hover:text-amber-400 transition-colors block"
                    >
                      {movie.title}
                    </Link>
                    <p className="text-xs text-slate-400 line-clamp-2">{movie.synopsis}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <Link
                      href={`/movies/${movie.id}`}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Pick Showtime & Seats</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
