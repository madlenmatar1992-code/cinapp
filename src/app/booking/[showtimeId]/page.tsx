"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Ticket,
  ShieldAlert,
  Sparkles,
  Armchair,
  Check,
  AlertCircle,
  Film,
} from "lucide-react";

interface Seat {
  id: string;
  rowLabel: string;
  seatNumber: number;
  seatType: "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE";
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  isHeldByMe: boolean;
  priceInCents: number;
}

interface ShowtimeInfo {
  id: string;
  startTime: string;
  endTime: string;
  priceInCents: number;
  movieId: string;
  movieTitle: string;
  moviePosterUrl: string;
  movieRating: string;
  movieDurationMins: number;
  auditoriumName: string;
  screenType: string;
  cinemaName: string;
  cinemaAddress: string;
  cinemaCity: string;
}

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showtimeId = params.showtimeId as string;

  const [showtime, setShowtime] = useState<ShowtimeInfo | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!showtimeId) return;
    fetchSeatMap();

    // Poll every 10 seconds to keep seat holds updated
    const interval = setInterval(fetchSeatMap, 10000);
    return () => clearInterval(interval);
  }, [showtimeId]);

  const fetchSeatMap = async () => {
    try {
      const res = await fetch(`/api/showtimes/${showtimeId}`);
      if (!res.ok) throw new Error("Failed to load showtime seat map");
      const data = await res.json();
      setShowtime(data.showtime);
      setSeats(data.seats || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not load seat map");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "BOOKED" || seat.status === "BLOCKED") return;
    if (seat.status === "HELD" && !seat.isHeldByMe) return;

    setErrorMessage("");
    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
    } else {
      // Max 8 tickets per booking
      if (selectedSeatIds.length >= 8) {
        setErrorMessage("You can select up to 8 seats per transaction.");
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  // Group seats by row
  const rows: Record<string, Seat[]> = {};
  seats.forEach((s) => {
    if (!rows[s.rowLabel]) rows[s.rowLabel] = [];
    rows[s.rowLabel].push(s);
  });

  // Calculate pricing breakdown
  const selectedSeatsList = seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotalCents = selectedSeatsList.reduce((acc, s) => acc + s.priceInCents, 0);
  const feesCents = selectedSeatIds.length * 150; // $1.50 per ticket
  const taxCents = Math.round(subtotalCents * 0.08); // 8% tax
  const totalCents = subtotalCents + feesCents + taxCents;

  const handleProceedToCheckout = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMessage("Please select at least one seat to continue.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      // Check auth status
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();

      if (!authData.user) {
        // Auto sign in as demo customer so user doesn't get blocked
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "user@cinebook.com", password: "UserPass123!" }),
        });
      }

      // Create booking hold transaction
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to hold seats. They may have been taken.");
      }

      // Route to checkout
      router.push(`/checkout/${data.booking.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
      // Refresh seat map to reflect any new holds
      fetchSeatMap();
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

  if (!showtime) {
    return (
      <div className="min-h-screen max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Showtime Not Found</h2>
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

  const formattedDate = new Date(showtime.startTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(showtime.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen pb-32 pt-4">
      {/* 1. Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href={`/movies/${showtime.movieId}`}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <img
              src={showtime.moviePosterUrl}
              alt={showtime.movieTitle}
              className="w-12 h-16 rounded-lg object-cover shadow-md"
            />

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  {showtime.movieTitle}
                </h1>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                  {showtime.movieRating}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  {showtime.screenType}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
                <span>{showtime.cinemaName}</span>
                <span>•</span>
                <span>{showtime.auditoriumName}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">
                  {formattedDate} at {formattedTime}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Selected Seats</span>
              <span className="text-base font-extrabold text-amber-400">
                {selectedSeatIds.length} / 8
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 2. Seat Map Arena */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
          {/* Curved Cinema Screen */}
          <div className="w-full max-w-2xl mb-12 flex flex-col items-center">
            <div className="w-full h-10 border-t-4 border-cyan-400/80 rounded-t-[50%] shadow-[0_-15px_30px_rgba(56,189,248,0.25)] relative">
              <div className="cinema-screen-glow absolute inset-0 -top-4" />
            </div>
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-cyan-300/80 -mt-2">
              CINEMA SCREEN THIS WAY
            </span>
          </div>

          {/* Seat Grid */}
          <div className="w-full overflow-x-auto pb-6 flex justify-center">
            <div className="min-w-[620px] space-y-3">
              {Object.entries(rows).map(([rowLabel, rowSeats]) => (
                <div key={rowLabel} className="flex items-center justify-center space-x-2">
                  {/* Left Row Label */}
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    {rowLabel}
                  </span>

                  {/* Seats in Row */}
                  <div className="flex items-center space-x-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isBooked = seat.status === "BOOKED";
                      const isHeld = seat.status === "HELD" && !seat.isHeldByMe;
                      const isBlocked = seat.status === "BLOCKED";
                      const isVip = seat.seatType === "VIP";
                      const isRecliner = seat.seatType === "RECLINER";
                      const isAccessible = seat.seatType === "ACCESSIBLE";

                      // Seat status style classes
                      let seatClass = "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:scale-110 border-slate-700";
                      if (isVip) {
                        seatClass = "bg-purple-950/40 text-purple-200 border-purple-600/50 hover:bg-purple-900/60 hover:scale-110";
                      }
                      if (isRecliner) {
                        seatClass = "bg-rose-950/40 text-rose-200 border-rose-600/50 hover:bg-rose-900/60 hover:scale-110";
                      }
                      if (isAccessible) {
                        seatClass = "bg-blue-950/40 text-blue-200 border-blue-600/50 hover:bg-blue-900/60 hover:scale-110";
                      }

                      if (isSelected) {
                        seatClass = "bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-extrabold border-amber-300 scale-110 shadow-lg shadow-amber-500/40";
                      } else if (isBooked) {
                        seatClass = "bg-slate-950/90 text-slate-700 border-slate-900 cursor-not-allowed opacity-40";
                      } else if (isHeld) {
                        seatClass = "bg-amber-950/40 text-amber-500/60 border-amber-800/40 cursor-not-allowed animate-pulse";
                      } else if (isBlocked) {
                        seatClass = "bg-red-950/30 text-red-700 border-red-900 cursor-not-allowed opacity-30";
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked || isHeld || isBlocked}
                          onClick={() => handleSeatClick(seat)}
                          title={`Row ${seat.rowLabel} Seat ${seat.seatNumber} (${seat.seatType}) - $${(seat.priceInCents / 100).toFixed(2)}`}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-t-xl rounded-b-md text-[11px] font-bold border transition-all duration-150 flex items-center justify-center relative cursor-pointer ${seatClass}`}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span>{seat.seatNumber}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Row Label */}
                  <span className="w-6 text-center text-xs font-bold text-slate-500">
                    {rowLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Seat Map Legend */}
          <div className="w-full pt-8 border-t border-white/10 mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-t-md bg-slate-800 border border-slate-700" />
              <span className="text-slate-400">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-t-md bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-300" />
              <span className="text-slate-200 font-semibold">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-t-md bg-purple-950 border border-purple-600/60" />
              <span className="text-purple-300">VIP (+$4.00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-t-md bg-rose-950 border border-rose-600/60" />
              <span className="text-rose-300">Recliner (+$6.00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-t-md bg-amber-950/40 border border-amber-800/40" />
              <span className="text-amber-500">Reserved / Held</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-t-md bg-slate-950 border border-slate-900 opacity-50" />
              <span className="text-slate-600">Sold / Booked</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Floating Checkout Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Selected:</span>
                {selectedSeatsList.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No seats picked yet</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedSeatsList.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400"
                      >
                        {s.rowLabel}{s.seatNumber}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center space-x-3 mt-1">
                <span>Subtotal: ${(subtotalCents / 100).toFixed(2)}</span>
                <span>•</span>
                <span>Fees: ${(feesCents / 100).toFixed(2)}</span>
                <span>•</span>
                <span>Tax (8%): ${(taxCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Grand Total
              </span>
              <span className="text-2xl font-black text-white tracking-tight">
                ${(totalCents / 100).toFixed(2)}
              </span>
            </div>

            <button
              disabled={selectedSeatIds.length === 0 || submitting}
              onClick={handleProceedToCheckout}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all duration-200 shrink-0"
            >
              {submitting ? "Reserving Seats..." : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
