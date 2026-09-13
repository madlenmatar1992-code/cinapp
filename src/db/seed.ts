import { db } from "./index";
import {
  users,
  genres,
  movies,
  movieGenres,
  cinemas,
  auditoriums,
  seats,
  showtimes,
  showtimeSeats,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { runMigrations } from "./migrate";

export async function seed() {
  console.log("🌱 Starting CineBook database seeding...");

  // Ensure tables are migrated
  await runMigrations();

  // 1. Seed Users (Admin and Customer)
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded with users. Checking remaining entities...");
  }

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", salt);
  const userPasswordHash = await bcrypt.hash("UserPass123!", salt);

  // Upsert users
  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@cinebook.com",
      name: "CineBook Administrator",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    })
    .onConflictDoNothing()
    .returning();

  const [customerUser] = await db
    .insert(users)
    .values({
      email: "user@cinebook.com",
      name: "Alex Johnson",
      passwordHash: userPasswordHash,
      role: "USER",
    })
    .onConflictDoNothing()
    .returning();

  console.log("👤 Users seeded (Admin: admin@cinebook.com / Customer: user@cinebook.com)");

  // 2. Seed Genres
  const genreList = [
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Drama", slug: "drama" },
    { name: "Adventure", slug: "adventure" },
    { name: "Animation", slug: "animation" },
    { name: "Thriller", slug: "thriller" },
    { name: "Mystery", slug: "mystery" },
  ];

  const insertedGenres: Record<string, string> = {};
  for (const g of genreList) {
    const [res] = await db
      .insert(genres)
      .values(g)
      .onConflictDoNothing()
      .returning();
    if (res) {
      insertedGenres[g.slug] = res.id;
    } else {
      const [existing] = await db.select().from(genres).where(eq(genres.slug, g.slug));
      if (existing) insertedGenres[g.slug] = existing.id;
    }
  }

  // 3. Seed Movies
  const movieList = [
    {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      synopsis:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
      durationMins: 166,
      releaseDate: "2024-03-01",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
      rating: "PG-13",
      language: "English",
      genres: ["sci-fi", "adventure", "drama"],
    },
    {
      title: "Oppenheimer",
      slug: "oppenheimer",
      synopsis:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, exploring the moral and scientific dilemmas of modern physics.",
      durationMins: 180,
      releaseDate: "2023-07-21",
      posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
      rating: "R",
      language: "English",
      genres: ["drama", "thriller"],
    },
    {
      title: "Interstellar",
      slug: "interstellar",
      synopsis:
        "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
      durationMins: 169,
      releaseDate: "2014-11-07",
      posterUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      rating: "PG-13",
      language: "English",
      genres: ["sci-fi", "adventure", "drama"],
    },
    {
      title: "Spider-Man: Across the Spider-Verse",
      slug: "spider-man-across-the-spider-verse",
      synopsis:
        "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When heroes clash on handling a new threat, Miles must redefine what it means to be a hero.",
      durationMins: 140,
      releaseDate: "2023-06-02",
      posterUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
      rating: "PG",
      language: "English",
      genres: ["animation", "action", "adventure"],
    },
    {
      title: "Inception",
      slug: "inception",
      synopsis:
        "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
      durationMins: 148,
      releaseDate: "2010-07-16",
      posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      rating: "PG-13",
      language: "English",
      genres: ["sci-fi", "action", "thriller"],
    },
    {
      title: "Blade Runner 2049",
      slug: "blade-runner-2049",
      synopsis:
        "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
      durationMins: 164,
      releaseDate: "2017-10-06",
      posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=gCcx85zbxz4",
      rating: "R",
      language: "English",
      genres: ["sci-fi", "mystery", "drama"],
    },
  ];

  const insertedMovies: any[] = [];
  for (const m of movieList) {
    let [mov] = await db
      .insert(movies)
      .values({
        title: m.title,
        slug: m.slug,
        synopsis: m.synopsis,
        durationMins: m.durationMins,
        releaseDate: m.releaseDate,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        trailerUrl: m.trailerUrl,
        rating: m.rating,
        language: m.language,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!mov) {
      const [existing] = await db.select().from(movies).where(eq(movies.slug, m.slug));
      mov = existing;
    }

    if (mov) {
      insertedMovies.push(mov);
      // Link genres
      for (const genreSlug of m.genres) {
        const genreId = insertedGenres[genreSlug];
        if (genreId) {
          await db
            .insert(movieGenres)
            .values({
              movieId: mov.id,
              genreId,
            })
            .onConflictDoNothing();
        }
      }
    }
  }
  console.log(`🎬 Seeded ${insertedMovies.length} movies with genre links`);

  // 4. Seed Cinemas
  const cinemaList = [
    {
      name: "CineBook Grand IMAX",
      slug: "cinebook-grand-imax",
      address: "1500 Broadway, Times Square",
      city: "New York",
      state: "NY",
      postalCode: "10036",
      phone: "+1 (212) 555-0199",
      email: "timessquare@cinebook.com",
    },
    {
      name: "CineBook Luxe & Recliner Lounge",
      slug: "cinebook-luxe-lounge",
      address: "10250 Santa Monica Blvd",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90067",
      phone: "+1 (310) 555-0144",
      email: "centurycity@cinebook.com",
    },
    {
      name: "CineBook Skyline Cinema",
      slug: "cinebook-skyline",
      address: "400 N Michigan Ave",
      city: "Chicago",
      state: "IL",
      postalCode: "60611",
      phone: "+1 (312) 555-0188",
      email: "chicago@cinebook.com",
    },
  ];

  const insertedCinemas: any[] = [];
  for (const c of cinemaList) {
    let [cin] = await db
      .insert(cinemas)
      .values(c)
      .onConflictDoNothing()
      .returning();
    if (!cin) {
      const [existing] = await db.select().from(cinemas).where(eq(cinemas.slug, c.slug));
      cin = existing;
    }
    if (cin) insertedCinemas.push(cin);
  }
  console.log(`🏛️ Seeded ${insertedCinemas.length} cinemas`);

  // 5. Seed Auditoriums and Seats
  const auditoriumsList = [
    { cinemaIdx: 0, name: "Screen 1 - IMAX Laser", totalSeats: 80, screenType: "IMAX" },
    { cinemaIdx: 0, name: "Screen 2 - Dolby Atmos", totalSeats: 80, screenType: "DOLBY_ATMOS" },
    { cinemaIdx: 1, name: "Screen 1 - Luxe VIP Suite", totalSeats: 80, screenType: "VIP_LOUNGE" },
    { cinemaIdx: 1, name: "Screen 2 - Standard Cinema", totalSeats: 80, screenType: "STANDARD" },
    { cinemaIdx: 2, name: "Screen 1 - Skyline IMAX", totalSeats: 80, screenType: "IMAX" },
    { cinemaIdx: 2, name: "Screen 2 - Atmos Hall", totalSeats: 80, screenType: "DOLBY_ATMOS" },
  ];

  const insertedAuditoriums: any[] = [];
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"]; // 8 rows, 10 seats = 80 seats

  for (const a of auditoriumsList) {
    const cinema = insertedCinemas[a.cinemaIdx];
    if (!cinema) continue;

    let [aud] = await db
      .insert(auditoriums)
      .values({
        cinemaId: cinema.id,
        name: a.name,
        totalSeats: a.totalSeats,
        screenType: a.screenType,
      })
      .onConflictDoNothing()
      .returning();

    if (!aud) {
      const [existing] = await db
        .select()
        .from(auditoriums)
        .where(eq(auditoriums.cinemaId, cinema.id));
      aud = existing;
    }

    if (aud) {
      insertedAuditoriums.push(aud);

      // Check if seats already created
      const existingSeats = await db
        .select()
        .from(seats)
        .where(eq(seats.auditoriumId, aud.id))
        .limit(1);

      if (existingSeats.length === 0) {
        // Create 80 seats
        const seatBatch: any[] = [];
        for (const row of rows) {
          for (let num = 1; num <= 10; num++) {
            let seatType = "STANDARD";
            if (row === "C" && (num === 1 || num === 10)) {
              seatType = "ACCESSIBLE";
            } else if (row === "G" || row === "H") {
              seatType = "RECLINER";
            } else if (row === "E" || row === "F") {
              seatType = "VIP";
            }

            seatBatch.push({
              auditoriumId: aud.id,
              rowLabel: row,
              seatNumber: num,
              seatType,
              isActive: true,
            });
          }
        }
        await db.insert(seats).values(seatBatch).onConflictDoNothing();
      }
    }
  }
  console.log(`💺 Seeded ${insertedAuditoriums.length} auditoriums with structured tiered seating`);

  // 6. Seed Showtimes and Showtime Seats
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 14, 0, 0));

  let showtimeCounter = 0;
  for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
    for (let audIdx = 0; audIdx < insertedAuditoriums.length; audIdx++) {
      const aud = insertedAuditoriums[audIdx];
      // Select movie
      const movie = insertedMovies[(audIdx + dayOffset) % insertedMovies.length];
      if (!movie) continue;

      // Create 2 showtimes per auditorium per day
      const times = [
        { hours: 14, mins: 0, price: 1750 }, // 2:00 PM ($17.50)
        { hours: 18, mins: 30, price: 2100 }, // 6:30 PM ($21.00)
        { hours: 21, mins: 15, price: 2350 }, // 9:15 PM ($23.50)
      ];

      for (const t of times) {
        const startTime = new Date(today);
        startTime.setUTCDate(today.getUTCDate() + dayOffset);
        startTime.setUTCHours(t.hours, t.mins, 0, 0);

        const endTime = new Date(startTime.getTime() + movie.durationMins * 60 * 1000);

        const [st] = await db
          .insert(showtimes)
          .values({
            movieId: movie.id,
            auditoriumId: aud.id,
            startTime,
            endTime,
            priceInCents: t.price,
            status: "SCHEDULED",
          })
          .returning();

        if (st) {
          showtimeCounter++;
          // Fetch auditorium seats
          const audSeats = await db
            .select()
            .from(seats)
            .where(eq(seats.auditoriumId, aud.id));

          // Generate showtime_seats
          const stSeatsBatch = audSeats.map((s: any) => ({
            showtimeId: st.id,
            seatId: s.id,
            status: "AVAILABLE",
          }));

          if (stSeatsBatch.length > 0) {
            await db.insert(showtimeSeats).values(stSeatsBatch).onConflictDoNothing();
          }
        }
      }
    }
  }

  console.log(`⏱️ Seeded ${showtimeCounter} showtimes with initialized seat availability maps`);
  console.log("🎉 CineBook database seeding completed successfully!");
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
