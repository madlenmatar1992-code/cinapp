"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Film,
  Sparkles,
  ChevronRight,
  Armchair,
  Volume2,
} from "lucide-react";

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      const res = await fetch("/api/cinemas");
      const data = await res.json();
      setCinemas(data.cinemas || []);
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
            Our Locations
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cinemas & Luxury Lounges
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Experience movies the way creators intended. Discover our cutting-edge IMAX Laser, Dolby Atmos, and VIP Suites across major metropolitan hubs.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl glass-card animate-pulse border border-white/5"
              />
            ))}
          </div>
        )}

        {/* Cinemas Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cinemas.map((cinema) => (
              <div
                key={cinema.id}
                className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {cinema.city}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {cinema.auditoriums?.length || 2} Screens
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{cinema.name}</h3>

                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
                      </span>
                    </p>
                    {cinema.phone && (
                      <p className="flex items-center space-x-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cinema.phone}</span>
                      </p>
                    )}
                    {cinema.email && (
                      <p className="flex items-center space-x-2 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cinema.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Auditoriums & Formats */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                      Auditorium Screens
                    </span>
                    <div className="space-y-1.5">
                      {cinema.auditoriums?.map((aud: any) => (
                        <div
                          key={aud.id}
                          className="p-2 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-200 font-medium">{aud.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold text-amber-400">
                            {aud.screenType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/?cinemaId=${cinema.id}`}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>View Movies at This Cinema</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
