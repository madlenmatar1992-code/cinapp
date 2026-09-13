import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }).notNull().default("USER"), // 'USER' | 'ADMIN'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_role").on(table.role),
  ]
);

// 2. Movies table
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    synopsis: text("synopsis").notNull(),
    durationMins: integer("duration_mins").notNull(),
    releaseDate: varchar("release_date", { length: 32 }).notNull(),
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url").notNull(),
    trailerUrl: text("trailer_url"),
    rating: varchar("rating", { length: 32 }).notNull().default("PG-13"), // 'G', 'PG', 'PG-13', 'R', 'NC-17'
    language: varchar("language", { length: 64 }).notNull().default("English"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_movies_title").on(table.title),
    index("idx_movies_is_active").on(table.isActive),
  ]
);

// 3. Genres table
export const genres = pgTable("genres", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// 4. Movie Genres junction
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.movieId, table.genreId] }),
    index("idx_movie_genres_movie").on(table.movieId),
    index("idx_movie_genres_genre").on(table.genreId),
  ]
);

// 5. Cinemas table
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 32 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_cinemas_city").on(table.city),
    index("idx_cinemas_is_active").on(table.isActive),
  ]
);

// 6. Auditoriums table
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    totalSeats: integer("total_seats").notNull(),
    screenType: varchar("screen_type", { length: 64 }).notNull().default("STANDARD"), // 'IMAX', 'DOLBY_ATMOS', 'STANDARD', 'VIP_LOUNGE'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_cinema_auditorium").on(table.cinemaId, table.name),
    index("idx_auditoriums_cinema").on(table.cinemaId),
  ]
);

// 7. Seats table
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    rowLabel: varchar("row_label", { length: 8 }).notNull(), // 'A', 'B', 'C'
    seatNumber: integer("seat_number").notNull(), // 1, 2, 3
    seatType: varchar("seat_type", { length: 32 }).notNull().default("STANDARD"), // 'STANDARD', 'VIP', 'RECLINER', 'ACCESSIBLE'
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    uniqueIndex("uq_auditorium_seat").on(
      table.auditoriumId,
      table.rowLabel,
      table.seatNumber
    ),
    index("idx_seats_auditorium").on(table.auditoriumId),
  ]
);

// 8. Showtimes table
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    priceInCents: integer("price_in_cents").notNull(), // Minor unit e.g. 1500 = $15.00
    status: varchar("status", { length: 32 }).notNull().default("SCHEDULED"), // 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_showtimes_movie").on(table.movieId),
    index("idx_showtimes_auditorium").on(table.auditoriumId),
    index("idx_showtimes_start_time").on(table.startTime),
  ]
);

// 9. Showtime Seats table
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 32 }).notNull().default("AVAILABLE"), // 'AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED'
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    heldByUserId: uuid("held_by_user_id"),
    bookingId: uuid("booking_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_showtime_seat").on(table.showtimeId, table.seatId),
    index("idx_showtime_seats_showtime").on(table.showtimeId),
    index("idx_showtime_seats_status").on(table.status),
    index("idx_showtime_seats_hold_expires").on(table.holdExpiresAt),
  ]
);

// 10. Bookings table
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    referenceCode: varchar("reference_code", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 32 }).notNull().default("PENDING"), // 'PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED'
    subtotalCents: integer("subtotal_cents").notNull(),
    feesCents: integer("fees_cents").notNull(),
    taxCents: integer("tax_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_bookings_user").on(table.userId),
    index("idx_bookings_showtime").on(table.showtimeId),
    index("idx_bookings_status").on(table.status),
    index("idx_bookings_reference").on(table.referenceCode),
  ]
);

// 11. Booking Items table
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id").notNull(),
    priceInCents: integer("price_in_cents").notNull(),
  },
  (table) => [
    index("idx_booking_items_booking").on(table.bookingId),
    index("idx_booking_items_seat").on(table.seatId),
  ]
);

// 12. Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("PENDING"), // 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'
    provider: varchar("provider", { length: 64 }).notNull().default("STRIPE_TEST"), // 'STRIPE_TEST' | 'MOCK_GATEWAY'
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_payments_booking").on(table.bookingId),
    index("idx_payments_idempotency").on(table.idempotencyKey),
  ]
);

// 13. Tickets table
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    ticketCode: varchar("ticket_code", { length: 64 }).notNull().unique(),
    qrPayload: text("qr_payload").notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_tickets_booking").on(table.bookingId),
    index("idx_tickets_code").on(table.ticketCode),
  ]
);

// 14. Audit Logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    action: varchar("action", { length: 64 }).notNull(), // 'BOOKING_CREATED', 'HOLD_RELEASED', 'PAYMENT_SUCCEEDED', 'BOOKING_CANCELLED'
    entity: varchar("entity", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }),
    details: text("details"), // JSON string
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_entity").on(table.entity, table.entityId),
  ]
);

// Relations Definitions
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
  booking: one(bookings, {
    fields: [showtimeSeats.bookingId],
    references: [bookings.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  items: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
}));
