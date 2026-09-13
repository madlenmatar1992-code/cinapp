import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import {
  bookings,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  bookingItems,
  seats,
  tickets,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBookings = await db
      .select({
        id: bookings.id,
        referenceCode: bookings.referenceCode,
        status: bookings.status,
        subtotalCents: bookings.subtotalCents,
        feesCents: bookings.feesCents,
        taxCents: bookings.taxCents,
        totalCents: bookings.totalCents,
        createdAt: bookings.createdAt,
        expiresAt: bookings.expiresAt,
        showtimeId: showtimes.id,
        startTime: showtimes.startTime,
        movieTitle: movies.title,
        moviePosterUrl: movies.posterUrl,
        movieRating: movies.rating,
        auditoriumName: auditoriums.name,
        screenType: auditoriums.screenType,
        cinemaName: cinemas.name,
        cinemaCity: cinemas.city,
      })
      .from(bookings)
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(bookings.createdAt));

    // Fetch items for each booking
    const bookingIds = userBookings.map((b: any) => b.id);
    let allItems: any[] = [];
    let allTickets: any[] = [];

    if (bookingIds.length > 0) {
      allItems = await db
        .select({
          bookingId: bookingItems.bookingId,
          rowLabel: seats.rowLabel,
          seatNumber: seats.seatNumber,
          seatType: seats.seatType,
          priceInCents: bookingItems.priceInCents,
        })
        .from(bookingItems)
        .innerJoin(seats, eq(bookingItems.seatId, seats.id));

      allTickets = await db.select().from(tickets);
    }

    const enriched = userBookings.map((b: any) => {
      const seatsForBooking = allItems
        .filter((item: any) => item.bookingId === b.id)
        .map((s: any) => `${s.rowLabel}${s.seatNumber}`);

      const ticket = allTickets.find((t: any) => t.bookingId === b.id);

      return {
        ...b,
        seats: seatsForBooking,
        ticketCode: ticket ? ticket.ticketCode : null,
      };
    });

    return NextResponse.json({ bookings: enriched });
  } catch (error: any) {
    console.error("User bookings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch booking history" },
      { status: 500 }
    );
  }
}
