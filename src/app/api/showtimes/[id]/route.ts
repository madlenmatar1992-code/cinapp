import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  showtimes,
  movies,
  auditoriums,
  cinemas,
  seats,
  showtimeSeats,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    // 1. Fetch showtime with joined movie, auditorium, cinema
    const [st] = await db
      .select({
        id: showtimes.id,
        startTime: showtimes.startTime,
        endTime: showtimes.endTime,
        priceInCents: showtimes.priceInCents,
        status: showtimes.status,
        movieId: movies.id,
        movieTitle: movies.title,
        moviePosterUrl: movies.posterUrl,
        movieRating: movies.rating,
        movieDurationMins: movies.durationMins,
        auditoriumId: auditoriums.id,
        auditoriumName: auditoriums.name,
        screenType: auditoriums.screenType,
        cinemaId: cinemas.id,
        cinemaName: cinemas.name,
        cinemaAddress: cinemas.address,
        cinemaCity: cinemas.city,
      })
      .from(showtimes)
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(eq(showtimes.id, id));

    if (!st) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    // 2. Fetch all seats for this auditorium
    const allSeats = await db
      .select()
      .from(seats)
      .where(eq(seats.auditoriumId, st.auditoriumId))
      .orderBy(asc(seats.rowLabel), asc(seats.seatNumber));

    // 3. Fetch all showtime_seats for this showtime
    const stSeats = await db
      .select()
      .from(showtimeSeats)
      .where(eq(showtimeSeats.showtimeId, id));

    const stSeatMap = new Map<string, any>();
    stSeats.forEach((s: any) => stSeatMap.set(s.seatId, s));

    const now = new Date();

    // 4. Combine seat details with live status
    const seatsWithStatus = allSeats.map((seat: any) => {
      const stSeat = stSeatMap.get(seat.id);
      let status = stSeat ? stSeat.status : "AVAILABLE";
      let isHeldByMe = false;

      // Check if temporary hold has expired
      if (status === "HELD") {
        if (stSeat?.holdExpiresAt && new Date(stSeat.holdExpiresAt) < now) {
          status = "AVAILABLE";
        } else if (currentUser && stSeat?.heldByUserId === currentUser.id) {
          isHeldByMe = true;
        }
      }

      // Calculate price based on seat tier
      let seatPriceInCents = st.priceInCents;
      if (seat.seatType === "VIP") seatPriceInCents += 400;
      if (seat.seatType === "RECLINER") seatPriceInCents += 600;

      return {
        id: seat.id,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status,
        isHeldByMe,
        priceInCents: seatPriceInCents,
      };
    });

    return NextResponse.json({
      showtime: st,
      seats: seatsWithStatus,
    });
  } catch (error: any) {
    console.error("Showtime fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch showtime seat map" },
      { status: 500 }
    );
  }
}
