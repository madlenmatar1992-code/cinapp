import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { showtimes, showtimeSeats, seats, movies, auditoriums } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { movieId, auditoriumId, startTime, priceInCents } = body;

    if (!movieId || !auditoriumId || !startTime || !priceInCents) {
      return NextResponse.json(
        { error: "movieId, auditoriumId, startTime, and priceInCents are required" },
        { status: 400 }
      );
    }

    const [movie] = await db.select().from(movies).where(eq(movies.id, movieId));
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + movie.durationMins * 60 * 1000);

    const [newShowtime] = await db
      .insert(showtimes)
      .values({
        movieId,
        auditoriumId,
        startTime: start,
        endTime: end,
        priceInCents: Number(priceInCents),
        status: "SCHEDULED",
      })
      .returning();

    // Generate showtime_seats for all seats in auditorium
    const audSeats = await db
      .select()
      .from(seats)
      .where(eq(seats.auditoriumId, auditoriumId));

    if (audSeats.length > 0) {
      const stSeatsBatch = audSeats.map((s: any) => ({
        showtimeId: newShowtime.id,
        seatId: s.id,
        status: "AVAILABLE",
      }));
      await db.insert(showtimeSeats).values(stSeatsBatch);
    }

    return NextResponse.json(
      { showtime: newShowtime, seatsCreated: audSeats.length },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Schedule showtime error:", error);
    const status = error.message === "FORBIDDEN" ? 403 : error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to schedule showtime" },
      { status }
    );
  }
}
