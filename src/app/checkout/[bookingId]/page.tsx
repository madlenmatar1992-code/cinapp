"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  Clock,
  AlertCircle,
  Film,
  Ticket,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Payment Form State
  const [cardName, setCardName] = useState("Alex Johnson");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    // Generate fresh idempotency key per booking session
    setIdempotencyKey(`idemp_${bookingId.slice(0, 8)}_${Date.now()}`);
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    fetchBooking();
  }, [bookingId]);

  // Hold Countdown Timer
  useEffect(() => {
    if (!bookingData?.booking?.expiresAt) return;

    const calculateTimeLeft = () => {
      const diff = new Date(bookingData.booking.expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingData]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) {
        throw new Error("Failed to load booking details");
      }
      const data = await res.json();

      if (data.booking.status === "CONFIRMED") {
        router.push(`/ticket/${bookingId}`);
        return;
      }

      setBookingData(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not retrieve booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          idempotencyKey,
          simulateFailure,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment was rejected");
      }

      // Success! Redirect to digital ticket
      router.push(`/ticket/${bookingId}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
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

  const { booking, showtime, items } = bookingData;
  const isExpired = timeLeft !== null && timeLeft <= 0;

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Breadcrumb & Countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={`/booking/${booking.showtimeId}`}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Modify Seat Selection</span>
          </Link>

          {/* Countdown timer pill */}
          <div
            className={`px-4 py-2 rounded-xl border flex items-center space-x-2 text-xs font-bold ${
              isExpired
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : timeLeft && timeLeft < 180
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                : "glass-card text-emerald-400 border-emerald-500/30"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {isExpired
                ? "Seat hold expired"
                : `Seats held for ${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Order Summary Column (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Booking Summary
                </h3>
                <span className="text-xs font-bold text-amber-400">
                  {booking.referenceCode}
                </span>
              </div>

              {/* Movie info snippet */}
              <div className="flex space-x-4">
                <img
                  src={showtime.moviePosterUrl}
                  alt={showtime.movieTitle}
                  className="w-16 h-24 rounded-lg object-cover shadow-md shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-white leading-tight">
                    {showtime.movieTitle}
                  </h4>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                      {showtime.movieRating}
                    </span>
                    <span>•</span>
                    <span className="text-amber-400 font-semibold">{showtime.screenType}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-tight pt-1">
                    {showtime.cinemaName} ({showtime.auditoriumName})
                  </p>
                  <p className="text-xs text-slate-300 font-medium">
                    {new Date(showtime.startTime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(showtime.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Selected Seats */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Reserved Seats ({items.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 flex items-center space-x-1.5"
                    >
                      <span className="text-amber-400">
                        {item.rowLabel}{item.seatNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({item.seatType})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Tickets Subtotal</span>
                  <span className="font-semibold">
                    ${(booking.subtotalCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Booking & Convenience Fees</span>
                  <span className="font-semibold">
                    ${(booking.feesCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>State & Local Tax (8%)</span>
                  <span className="font-semibold">
                    ${(booking.taxCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-white/10">
                  <span>Total Amount</span>
                  <span className="text-amber-400 text-lg">
                    ${(booking.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400 px-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Encrypted end-to-end checkout with payment idempotency protection.
              </span>
            </div>
          </div>

          {/* Payment Card Column (Right 7 Cols) */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span>Secure Payment</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulated test payment gateway. No real credit card charge occurs.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 uppercase tracking-wider">
                  TEST MODE
                </span>
              </div>

              {/* Preset Test Card Helper Pills */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Quick Select Test Cards
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber("4242 4242 4242 4242");
                      setSimulateFailure(false);
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                      !simulateFailure
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>Success Card (4242...)</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber("4000 0000 0000 0002");
                      setSimulateFailure(true);
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between ${
                      simulateFailure
                        ? "bg-red-500/10 border-red-500/40 text-red-300 font-semibold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span>Decline Test Card</span>
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
                {/* Cardholder Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <CreditCard className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Simulate failure toggle */}
                <div className="pt-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="failToggle"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-800 cursor-pointer"
                  />
                  <label htmlFor="failToggle" className="text-xs text-slate-400 cursor-pointer">
                    Simulate card decline to test error handling and retry idempotency
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={paying || isExpired}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {paying
                        ? "Verifying Payment & Issuing Ticket..."
                        : `Pay $${(booking.totalCents / 100).toFixed(2)} & Confirm`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
