"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle2,
  Film,
  RefreshCw,
} from "lucide-react";

interface BookingItem {
  id: string;
  referenceCode: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  totalCents: number;
  createdAt: string;
  showtimeId: string;
  startTime: string;
  movieTitle: string;
  moviePosterUrl: string;
  movieRating: string;
  auditoriumName: string;
  screenType: string;
  cinemaName: string;
  cinemaCity: string;
  seats: string[];
  ticketCode: string | null;
}

export default function BookingsHistoryPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/bookings");
      if (!res.ok) {
        throw new Error("Failed to load booking history");
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/bookings/${cancelModalBooking.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setMessage({
        type: "success",
        text: `Booking ${cancelModalBooking.referenceCode} successfully cancelled and seats released.`,
      });
      setCancelModalBooking(null);
      await fetchBookings();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setCancelling(false);
    }
  };

  const now = new Date();
  const filteredBookings = bookings.filter((b) => {
    const isUpcoming = new Date(b.startTime) > now && b.status === "CONFIRMED";
    if (activeTab === "UPCOMING") return isUpcoming;
    if (activeTab === "PAST") return !isUpcoming;
    return true;
  });

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <Ticket className="w-7 h-7 text-amber-400" />
              <span>My Cinema Bookings</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage your cinema reservations, digital usher passes, and cancellations.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchBookings}
              className="p-2 rounded-xl glass-card text-slate-400 hover:text-white border border-white/10"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
            >
              Book New Movie
            </Link>
          </div>
        </div>

        {/* Status Notification Message */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center space-x-2 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border border-red-500/30 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "ALL"
                ? "bg-white/10 text-white border border-white/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "UPCOMING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Upcoming Active
          </button>
          <button
            onClick={() => setActiveTab("PAST")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "PAST"
                ? "bg-white/10 text-white border border-white/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Past & Cancelled
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl glass-card animate-pulse border border-white/5"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="rounded-2xl glass-card p-12 text-center space-y-4 max-w-md mx-auto border border-white/5">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center mx-auto">
              <Film className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
            <p className="text-xs text-slate-400">
              You do not have any bookings in this section yet.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              Explore Now Showing Movies
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const showDate = new Date(b.startTime).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const showTime = new Date(b.startTime).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

              // Status badge style
              let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
              if (b.status === "CONFIRMED") {
                badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
              } else if (b.status === "CANCELLED" || b.status === "REFUNDED") {
                badgeColor = "bg-red-500/20 text-red-400 border-red-500/40";
              } else if (b.status === "PENDING") {
                badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/40";
              }

              const isEligibleForCancellation =
                b.status === "CONFIRMED" && new Date(b.startTime) > now;

              return (
                <div
                  key={b.id}
                  className="glass-card rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex space-x-4">
                    <img
                      src={b.moviePosterUrl}
                      alt={b.movieTitle}
                      className="w-16 h-24 rounded-xl object-cover shadow-md shrink-0 border border-white/10"
                    />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${badgeColor}`}>
                          {b.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Ref: <span className="text-white font-bold">{b.referenceCode}</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          {b.screenType}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white">{b.movieTitle}</h3>

                      <p className="text-xs text-slate-400 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {b.cinemaName} • {b.auditoriumName}
                        </span>
                      </p>

                      <p className="text-xs text-slate-300 flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {showDate} at {showTime}
                        </span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">
                          Seats: {b.seats.join(", ")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Total Amount
                      </span>
                      <span className="text-lg font-black text-white">
                        ${(b.totalCents / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isEligibleForCancellation && (
                        <button
                          onClick={() => setCancelModalBooking(b)}
                          className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {b.status === "CONFIRMED" ? (
                        <Link
                          href={`/ticket/${b.id}`}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>View Ticket</span>
                        </Link>
                      ) : b.status === "PENDING" ? (
                        <Link
                          href={`/checkout/${b.id}`}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5"
                        >
                          <span>Complete Payment</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span>Cancel Reservation?</span>
              </h3>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your reservation for{" "}
              <strong className="text-white">{cancelModalBooking.movieTitle}</strong> (Reference:{" "}
              <strong className="text-amber-400">{cancelModalBooking.referenceCode}</strong>)?
            </p>

            <p className="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-white/5">
              Your seats ({cancelModalBooking.seats.join(", ")}) will immediately be released back to
              the public seat pool. A simulated refund of $
              {(cancelModalBooking.totalCents / 100).toFixed(2)} will be credited back.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl glass-card text-xs font-semibold text-slate-300 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                disabled={cancelling}
                onClick={handleCancelConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
              >
                {cancelling ? "Releasing Seats..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
