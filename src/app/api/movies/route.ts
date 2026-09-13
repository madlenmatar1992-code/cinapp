import { NextResponse } from "next/server";
import { db } from "@/db";
import { movies, genres, movieGenres, showtimes, auditoriums } from "@/db/schema";
import { eq, and, ilike, sql, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase();
    const genreSlug = searchParams.get("genre");
    const language = searchParams.get("language");
    const cinemaId = searchParams.get("cinemaId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    // Fetch all active movies
    let allMovies = await db
      .select()
      .from(movies)
      .where(eq(movies.isActive, true));

    // Fetch all genres and links
    const allGenres = await db.select().from(genres);
    const allLinks = await db.select().from(movieGenres);

    // Filter by query
    if (query) {
      allMovies = allMovies.filter(
        (m: any) =>
          m.title.toLowerCase().includes(query) ||
          m.synopsis.toLowerCase().includes(query)
      );
    }

    // Filter by language
    if (language) {
      allMovies = allMovies.filter(
        (m: any) => m.language.toLowerCase() === language.toLowerCase()
      );
    }

    // Filter by genre
    if (genreSlug) {
      const targetGenre = allGenres.find((g: any) => g.slug === genreSlug);
      if (targetGenre) {
        const allowedMovieIds = new Set(
          allLinks
            .filter((l: any) => l.genreId === targetGenre.id)
            .map((l: any) => l.movieId)
        );
        allMovies = allMovies.filter((m: any) => allowedMovieIds.has(m.id));
      }
    }

    // Filter by cinema or date using showtimes
    if (cinemaId || dateStr) {
      let stQuery = db
        .select({
          movieId: showtimes.movieId,
          startTime: showtimes.startTime,
          cinemaId: auditoriums.cinemaId,
        })
        .from(showtimes)
        .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id));

      const showtimeResults = await stQuery;
      const validMovieIds = new Set<string>();

      for (const st of showtimeResults) {
        let matchesCinema = true;
        let matchesDate = true;

        if (cinemaId && st.cinemaId !== cinemaId) {
          matchesCinema = false;
        }

        if (dateStr) {
          const stDate = new Date(st.startTime).toISOString().slice(0, 10);
          if (stDate !== dateStr) {
            matchesDate = false;
          }
        }

        if (matchesCinema && matchesDate) {
          validMovieIds.add(st.movieId);
        }
      }

      allMovies = allMovies.filter((m: any) => validMovieIds.has(m.id));
    }

    // Attach genre objects to each movie
    const moviesWithGenres = allMovies.map((m: any) => {
      const movieGenreIds = new Set(
        allLinks.filter((l: any) => l.movieId === m.id).map((l: any) => l.genreId)
      );
      const mGenres = allGenres.filter((g: any) => movieGenreIds.has(g.id));
      return {
        ...m,
        genres: mGenres,
      };
    });

    return NextResponse.json({
      movies: moviesWithGenres,
      genres: allGenres,
    });
  } catch (error: any) {
    console.error("Fetch movies error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
