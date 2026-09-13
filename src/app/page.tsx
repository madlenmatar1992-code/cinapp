"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Film,
  Star,
  Clock,
  Play,
  X,
  Ticket,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMins: number;
  releaseDate: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  rating: string;
  language: string;
  genres: { id: string; name: string; slug: string }[];
}

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [trailerModalUrl, setTrailerModalUrl] = useState<string | null>(null);

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
    fetchCinemas();
    fetchMovies();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [searchQuery, selectedGenre, selectedCinema, selectedDate]);

  const fetchCinemas = async () => {
    try {
      const res = await fetch("/api/cinemas");
      const data = await res.json();
      if (data.cinemas) setCinemas(data.cinemas);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedGenre) params.set("genre", selectedGenre);
      if (selectedCinema) params.set("cinemaId", selectedCinema);
      if (selectedDate) params.set("date", selectedDate);

      const res = await fetch(`/api/movies?${params.toString()}`);
      const data = await res.json();
      if (data.movies) setMovies(data.movies);
      if (data.genres) setGenres(data.genres);
    } catch (err) {
      console.error("Failed to load movies:", err);
    } finally {
      setLoading(false);
    }
  };

  const featuredMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div className="min-h-screen flex flex-col space-y-12">
      {/* 1. Hero Spotlight Section */}
      {featuredMovie && (
        <section className="relative w-full h-[550px] lg:h-[650px] overflow-hidden">
          {/* Backdrop with gradient overlays */}
          <div className="absolute inset-0 z-0">
            <img
              src={featuredMovie.backdropUrl}
              alt={featuredMovie.title}
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/80 to-transparent w-full md:w-3/4" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-16 lg:pb-24">
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Featured Premiere</span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
                  {featuredMovie.rating}
                </span>
                <div className="flex items-center space-x-1 text-amber-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{featuredMovie.durationMins} mins</span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
                {featuredMovie.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                {featuredMovie.synopsis}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {featuredMovie.genres?.map((g) => (
                  <span
                    key={g.id}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-slate-200 border border-white/10"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={`/movies/${featuredMovie.id}`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center space-x-2 shadow-lg shadow-amber-500/30 hover:scale-105 transition-all duration-200"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Tickets Now</span>
                </Link>

                {featuredMovie.trailerUrl && (
                  <button
                    onClick={() => setTrailerModalUrl(featuredMovie.trailerUrl)}
                    className="px-5 py-3 rounded-xl glass-card text-slate-200 hover:text-white text-sm font-semibold flex items-center space-x-2 hover:bg-white/10 transition-colors"
                  >
                    <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Interactive Search & Filters Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-8 relative z-20">
        <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/10 space-y-4">
          {/* Top Row: Search & Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies by title or storyline..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Cinema Dropdown */}
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                aria-label="Filter by Cinema"
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
              >
                <option value="">All Cinema Locations</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Tabs Dropdown on mobile / direct buttons on desktop */}
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Filter by Date"
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
              >
                <option value="">Any Date</option>
                {dateOptions.map((d) => (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Row: Genre Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <button
              onClick={() => setSelectedGenre("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === ""
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g.slug === selectedGenre ? "" : g.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === g.slug
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Now Showing Movies Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Now Showing</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {movies.length} Movies
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select a movie to explore showtimes, IMAX formats, and seat selection.
            </p>
          </div>

          <Link
            href="/showtimes"
            className="hidden sm:flex items-center space-x-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            <span>View Full Schedule</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-2xl bg-slate-900/60 animate-pulse border border-white/5"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && movies.length === 0 && (
          <div className="rounded-2xl glass-card p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Movies Found</h3>
            <p className="text-xs text-slate-400">
              No movies match your current search and filter selections. Try resetting the filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("");
                setSelectedCinema("");
                setSelectedDate("");
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Movie Cards */}
        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="group flex flex-col rounded-2xl overflow-hidden glass-card hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-amber-500/10"
              >
                {/* Poster container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Rating badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-white/10">
                    {movie.rating}
                  </div>
                  {/* Language */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[10px] font-extrabold uppercase">
                    {movie.language.slice(0, 2)}
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <span className="w-full py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs text-center shadow-lg">
                      View Showtimes
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1">
                      <span>{movie.durationMins}m</span>
                      <span>•</span>
                      <span className="truncate">{movie.genres?.[0]?.name || "Cinema"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-amber-400 font-semibold">
                    <span>Book Seats</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Experience & Cinema Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
        <div className="rounded-3xl glass-card border border-white/10 p-8 sm:p-12 relative overflow-hidden">
          <div className="cinema-screen-glow absolute -top-24 left-1/4 right-1/4 h-32" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
              The CineBook Experience
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Reinventing the Cinema Journey
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every auditorium features precision acoustics, ultra-high-gain silver screens, and motorized VIP leather recliners with reserved seat locking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
                <h4 className="text-sm font-bold text-amber-400">IMAX Laser 70mm</h4>
                <p className="text-xs text-slate-400">
                  Next-generation dual 4K laser projection with crystal-clear contrast.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
                <h4 className="text-sm font-bold text-amber-400">Dolby Atmos</h4>
                <p className="text-xs text-slate-400">
                  Full 64-channel spatial sound that flows completely around you.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5">
                <h4 className="text-sm font-bold text-amber-400">Zero Wait QR Code</h4>
                <p className="text-xs text-slate-400">
                  Instant mobile barcode pass ready for direct usher scanning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trailer Video Modal */}
      {trailerModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Official Movie Trailer</span>
              </h3>
              <button
                onClick={() => setTrailerModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full">
              {/* If YouTube URL, transform to embed format */}
              <iframe
                src={trailerModalUrl.replace("watch?v=", "embed/")}
                title="Movie Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
