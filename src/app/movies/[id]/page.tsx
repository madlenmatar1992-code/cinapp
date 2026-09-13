"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Play,
  Star,
  Ticket,
  ChevronLeft,
  X,
  Sparkles,
  Film,
  Volume2,
} from "lucide-react";

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Generate next 5 date options
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
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0].dateStr);
    }
  }, []);

  useEffect(() => {
    if (!movieId) return;
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies/${movieId}`);
      if (!res.ok) {
        throw new Error("Movie not found");
      }
      const data = await res.json();
      setMovie(data.movie);
      setShowtimes(data.showtimes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load movie details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <p className="text-slate-400">{error || "Could not find requested movie."}</p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Movies</span>
        </Link>
      </div>
    );
  }

  // Filter showtimes by selected date
  const filteredShowtimes = showtimes.filter((st) => {
    const stDate = new Date(st.startTime).toISOString().slice(0, 10);
    return stDate === selectedDate;
  });

  // Group filtered showtimes by cinema
  const showtimesByCinema: Record<string, { cinema: any; showtimes: any[] }> = {};
  filteredShowtimes.forEach((st) => {
    if (!showtimesByCinema[st.cinemaId]) {
      showtimesByCinema[st.cinemaId] = {
        cinema: {
          id: st.cinemaId,
          name: st.cinemaName,
          address: st.cinemaAddress,
          city: st.cinemaCity,
        },
        showtimes: [],
      };
    }
    showtimesByCinema[st.cinemaId].showtimes.push(st);
  });

  return (
    <div className="min-h-screen pb-20">
      {/* 1. Backdrop Banner */}
      <div className="relative w-full h-[450px] lg:h-[550px] overflow-hidden">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-transparent to-[#07090e]" />

        {/* Back Link */}
        <div className="absolute top-6 left-4 sm:left-8 z-20">
          <Link
            href="/"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg glass-panel text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>All Movies</span>
          </Link>
        </div>
      </div>

      {/* 2. Main Content Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-64 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Poster Column */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start">
            <div className="w-64 sm:w-72 lg:w-full aspect-[2/3] rounded-2xl overflow-hidden glass-card shadow-2xl border border-white/10 relative group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              {movie.trailerUrl && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-2 text-white"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">Play Trailer</span>
                </button>
              )}
            </div>

            {movie.trailerUrl && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="w-64 sm:w-72 lg:w-full mt-4 py-2.5 rounded-xl glass-panel text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Watch Official Trailer</span>
              </button>
            )}
          </div>

          {/* Details & Showtimes Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Movie Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                  {movie.rating}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                  {movie.language}
                </span>
                <div className="flex items-center space-x-1 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{movie.durationMins} minutes</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Released {movie.releaseDate}</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2">
                {movie.genres?.map((g: any) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-200"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Storyline
                </h3>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {movie.synopsis}
                </p>
              </div>
            </div>

            {/* Showtime Selection Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <Ticket className="w-5 h-5 text-amber-400" />
                  <span>Select Showtime & Experience</span>
                </h2>
              </div>

              {/* Date Tabs */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
                {dateOptions.map((d) => (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex flex-col items-center min-w-[90px] ${
                      selectedDate === d.dateStr
                        ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 scale-105"
                        : "glass-card text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{d.label}</span>
                    <span className="text-[10px] opacity-75">{d.dateStr}</span>
                  </button>
                ))}
              </div>

              {/* Cinema Schedule List */}
              {Object.keys(showtimesByCinema).length === 0 ? (
                <div className="p-8 rounded-2xl glass-card text-center space-y-2 border border-white/5">
                  <Film className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">
                    No showtimes scheduled for this date.
                  </p>
                  <p className="text-xs text-slate-500">
                    Please select another date above to view upcoming screenings.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(showtimesByCinema).map(({ cinema, showtimes }) => (
                    <div
                      key={cinema.id}
                      className="glass-card rounded-2xl p-5 border border-white/10 space-y-4"
                    >
                      {/* Cinema Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-1">
                        <div>
                          <h3 className="text-base font-bold text-white">{cinema.name}</h3>
                          <p className="text-xs text-slate-400 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>
                              {cinema.address}, {cinema.city}
                            </span>
                          </p>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 w-fit">
                          {showtimes.length} Screenings
                        </span>
                      </div>

                      {/* Showtime Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {showtimes.map((st) => {
                          const timeStr = new Date(st.startTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          });

                          return (
                            <Link
                              key={st.id}
                              href={`/booking/${st.id}`}
                              className="group p-3 rounded-xl bg-slate-900/90 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 flex flex-col space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-extrabold text-white group-hover:text-amber-400">
                                  {timeStr}
                                </span>
                                <span className="text-xs font-bold text-amber-400">
                                  ${(st.priceInCents / 100).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="truncate">{st.auditoriumName}</span>
                                <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-bold text-slate-300">
                                  {st.screenType}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerOpen && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{movie.title} - Official Trailer</span>
              </h3>
              <button
                onClick={() => setTrailerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full">
              <iframe
                src={movie.trailerUrl.replace("watch?v=", "embed/")}
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
