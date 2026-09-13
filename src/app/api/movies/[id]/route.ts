import { NextResponse } from "next/server";
import { db } from "@/db";
import { movies, genres, movieGenres, showtimes, auditoriums, cinemas } from "@/db/schema";
import { eq, and, gte, asc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [movie] = await db
      .select()
      .from(movies)
      .where(eq(movies.id, id));

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Get genres
    const links = await db
      .select()
      .from(movieGenres)
      .where(eq(movieGenres.movieId, movie.id));

    const allGenres = await db.select().from(genres);
    const movieGenreIds = new Set(links.map((l: any) => l.genreId));
    const movieGenresList = allGenres.filter((g: any) => movieGenreIds.has(g.id));

    // Get upcoming showtimes
    const now = new Date();
    const movieShowtimes = await db
      .select({
        id: showtimes.id,
        startTime: showtimes.startTime,
        endTime: showtimes.endTime,
        priceInCents: showtimes.priceInCents,
        status: showtimes.status,
        auditoriumId: auditoriums.id,
        auditoriumName: auditoriums.name,
        screenType: auditoriums.screenType,
        cinemaId: cinemas.id,
        cinemaName: cinemas.name,
        cinemaCity: cinemas.city,
        cinemaAddress: cinemas.address,
      })
      .from(showtimes)
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(
        and(
          eq(showtimes.movieId, movie.id),
          gte(showtimes.startTime, now)
        )
      )
      .orderBy(asc(showtimes.startTime));

    return NextResponse.json({
      movie: {
        ...movie,
        genres: movieGenresList,
      },
      showtimes: movieShowtimes,
    });
  } catch (error: any) {
    console.error("Movie detail error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
