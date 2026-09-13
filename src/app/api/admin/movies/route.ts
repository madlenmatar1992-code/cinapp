import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { movies, movieGenres, genres } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      title,
      synopsis,
      durationMins,
      releaseDate,
      posterUrl,
      backdropUrl,
      trailerUrl,
      rating,
      language,
      genreIds,
    } = body;

    if (!title || !synopsis || !durationMins || !releaseDate || !posterUrl) {
      return NextResponse.json(
        { error: "Title, synopsis, duration, release date, and poster URL are required" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const [newMovie] = await db
      .insert(movies)
      .values({
        title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        synopsis,
        durationMins: Number(durationMins),
        releaseDate,
        posterUrl,
        backdropUrl: backdropUrl || posterUrl,
        trailerUrl: trailerUrl || null,
        rating: rating || "PG-13",
        language: language || "English",
        isActive: true,
      })
      .returning();

    if (Array.isArray(genreIds) && genreIds.length > 0) {
      await db.insert(movieGenres).values(
        genreIds.map((genreId: string) => ({
          movieId: newMovie.id,
          genreId,
        }))
      );
    }

    return NextResponse.json({ movie: newMovie }, { status: 201 });
  } catch (error: any) {
    console.error("Create movie error:", error);
    const status = error.message === "FORBIDDEN" ? 403 : error.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to create movie" },
      { status }
    );
  }
}
