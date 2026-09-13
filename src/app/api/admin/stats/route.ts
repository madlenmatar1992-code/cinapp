import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import {
  bookings,
  movies,
  showtimes,
  tickets,
  auditLogs,
  users,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();

    // 1. Total revenue
    const revenueResult = await db
      .select({
        totalRevenueCents: sql<number>`coalesce(sum(${bookings.totalCents}), 0)`,
      })
      .from(bookings)
      .where(eq(bookings.status, "CONFIRMED"));

    const totalRevenueCents = Number(revenueResult[0]?.totalRevenueCents || 0);

    // 2. Total tickets
    const allTickets = await db.select().from(tickets);
    const ticketsCount = allTickets.length;

    // 3. Total active movies
    const activeMovies = await db
      .select()
      .from(movies)
      .where(eq(movies.isActive, true));

    // 4. Total showtimes
    const allShowtimes = await db.select().from(showtimes);

    // 5. Recent bookings
    const recentBookings = await db
      .select({
        id: bookings.id,
        referenceCode: bookings.referenceCode,
        status: bookings.status,
        totalCents: bookings.totalCents,
        createdAt: bookings.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(10);

    // 6. Recent audit logs
    const recentAuditLogs = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(15);

    return NextResponse.json({
      stats: {
        totalRevenueCents,
        ticketsCount,
        activeMoviesCount: activeMovies.length,
        showtimesCount: allShowtimes.length,
      },
      recentBookings,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    const status = error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin stats" },
      { status }
    );
  }
}
