"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Printer,
  Download,
  Calendar,
  MapPin,
  Film,
  Ticket,
  ChevronRight,
  Share2,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [bookingData, setBookingData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    fetchTicket();
  }, [bookingId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Ticket not found");
      const data = await res.json();
      setBookingData(data);

      if (data.ticket) {
        // Render QR Code
        const url = await QRCode.toDataURL(data.ticket.qrPayload, {
          width: 360,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(url);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCalendar = () => {
    if (!bookingData) return;
    const { showtime } = bookingData;
    const title = `Movie: ${showtime.movieTitle} at ${showtime.cinemaName}`;
    const start = new Date(showtime.startTime).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(showtime.endTime).toISOString().replace(/-|:|\.\d+/g, "");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:CineBook reservation. Reference: ${bookingData.booking.referenceCode}
LOCATION:${showtime.cinemaAddress}, ${showtime.cinemaCity}
DTSTART:${start}
DTEND:${end}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CineBook-${showtime.movieTitle.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !bookingData || !bookingData.ticket) {
    return (
      <div className="min-h-screen max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Ticket Not Found or Pending</h2>
        <p className="text-slate-400">{error || "Please complete payment to generate your ticket."}</p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
        >
          <span>Back to Movies</span>
        </Link>
      </div>
    );
  }

  const { booking, showtime, items, ticket } = bookingData;

  const showDate = new Date(showtime.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const showTime = new Date(showtime.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen pb-24 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Success Header Message */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Your seats are reserved and verified. Present this digital ticket at the usher podium.
          </p>
        </div>

        {/* The Digital Cinema Ticket */}
        <div className="relative rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl ticket-edge-cut">
          {/* Golden Ticket Header Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-5 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Film className="w-5 h-5" />
              <span className="font-black tracking-wider text-sm uppercase">
                CineBook Digital Admission Pass
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-900">
                REF:
              </span>
              <span className="text-sm font-black font-mono tracking-wider bg-slate-950/20 px-2 py-0.5 rounded">
                {booking.referenceCode}
              </span>
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Movie & Cinema Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex space-x-4">
                <img
                  src={showtime.moviePosterUrl}
                  alt={showtime.movieTitle}
                  className="w-20 h-28 rounded-xl object-cover shadow-lg border border-white/10 shrink-0"
                />
                <div className="space-y-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                    {showtime.screenType}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {showtime.movieTitle}
                  </h2>
                  <p className="text-xs text-slate-300 font-semibold">
                    {showtime.cinemaName} • {showtime.auditoriumName}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {showtime.cinemaAddress}, {showtime.cinemaCity}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Screening Date, Time, and Seats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-6 border-b border-white/10 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                  Date
                </span>
                <span className="text-slate-100 font-extrabold text-sm block">
                  {showDate}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                  Showtime
                </span>
                <span className="text-amber-400 font-extrabold text-base block">
                  {showTime}
                </span>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                  Auditorium
                </span>
                <span className="text-slate-100 font-extrabold text-sm block">
                  {showtime.auditoriumName}
                </span>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="space-y-2 pb-6 border-b border-white/10">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                Reserved Seats ({items.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {items.map((seat: any) => (
                  <div
                    key={seat.id}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/30 text-slate-100 text-xs font-bold flex items-center space-x-2"
                  >
                    <span className="text-amber-400 font-mono text-sm">
                      Row {seat.rowLabel} - Seat {seat.seatNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      [{seat.seatType}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code & Barcode Verification Block */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
                  Digital Usher Pass
                </span>
                <p className="text-xs text-slate-300 max-w-xs">
                  Scan at the auditorium entrance. Valid for admission of {items.length} guest(s).
                </p>
                <div className="text-xs text-slate-400 font-mono pt-1">
                  Ticket Code: <span className="text-amber-400 font-bold">{ticket.ticketCode}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Total Paid:{" "}
                  <span className="text-white font-bold">
                    ${(booking.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* High-Resolution Scannable QR Code */}
              {qrDataUrl && (
                <div className="p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center shrink-0">
                  <img
                    src={qrDataUrl}
                    alt="Digital Ticket QR Code"
                    className="w-40 h-40 object-contain"
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-900 uppercase tracking-widest mt-1">
                    CINEBOOK VERIFIED
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handlePrint}
            className="py-3 px-4 rounded-xl glass-card text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Pass</span>
          </button>

          <button
            onClick={handleDownloadCalendar}
            className="py-3 px-4 rounded-xl glass-card text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Add to Calendar</span>
          </button>

          <Link
            href="/bookings"
            className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>View All Bookings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
