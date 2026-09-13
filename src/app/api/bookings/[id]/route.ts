import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  bookings,
  bookingItems,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  seats,
  payments,
  tickets,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check user isolation: standard user cannot view another user's booking
    if (user.role !== "ADMIN" && booking.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this booking" },
        { status: 403 }
      );
    }

    // 2. Fetch showtime with movie, auditorium, cinema
    const [st] = await db
      .select({
        id: showtimes.id,
        startTime: showtimes.startTime,
        endTime: showtimes.endTime,
        movieTitle: movies.title,
        moviePosterUrl: movies.posterUrl,
        movieRating: movies.rating,
        movieDurationMins: movies.durationMins,
        auditoriumName: auditoriums.name,
        screenType: auditoriums.screenType,
        cinemaName: cinemas.name,
        cinemaAddress: cinemas.address,
        cinemaCity: cinemas.city,
      })
      .from(showtimes)
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(eq(showtimes.id, booking.showtimeId));

    // 3. Fetch booking items and joined seats
    const items = await db
      .select({
        id: bookingItems.id,
        priceInCents: bookingItems.priceInCents,
        seatId: seats.id,
        rowLabel: seats.rowLabel,
        seatNumber: seats.seatNumber,
        seatType: seats.seatType,
      })
      .from(bookingItems)
      .innerJoin(seats, eq(bookingItems.seatId, seats.id))
      .where(eq(bookingItems.bookingId, booking.id));

    // 4. Fetch payment if any
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, booking.id));

    // 5. Fetch ticket if confirmed
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.bookingId, booking.id));

    return NextResponse.json({
      booking,
      showtime: st,
      items,
      payment: payment || null,
      ticket: ticket || null,
    });
  } catch (error: any) {
    console.error("Fetch booking detail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load booking" },
      { status: 500 }
    );
  }
}
