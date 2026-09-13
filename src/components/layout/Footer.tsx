import Link from "next/link";
import { Film, ShieldCheck, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                <Film className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold tracking-wider text-amber-400">
                CINEBOOK
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The premier cinematic destination. State-of-the-art IMAX Laser,
              Dolby Atmos sound, and VIP Recliner luxury seating.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Real-Time Seat Locking & Verified Payments</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Cinema Formats
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="hover:text-amber-400 transition-colors">IMAX with Laser 70mm</li>
              <li className="hover:text-amber-400 transition-colors">Dolby Atmos Surround</li>
              <li className="hover:text-amber-400 transition-colors">VIP Luxury Recliner Suite</li>
              <li className="hover:text-amber-400 transition-colors">D-BOX Motion Seats</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-amber-400 transition-colors">
                  Cinema Locations
                </Link>
              </li>
              <li>
                <Link href="/showtimes" className="hover:text-amber-400 transition-colors">
                  Browse Showtimes
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition-colors">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Technology Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Next.js 15 App Router
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                TypeScript
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Neon PostgreSQL
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Drizzle ORM
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Tailwind CSS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              All prices stored in minor integer units. ACID seat reservation transactions.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CineBook Inc. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built with precision for cinema enthusiasts</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
