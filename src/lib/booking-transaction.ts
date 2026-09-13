import { db } from "@/db";
import {
  bookings,
  bookingItems,
  showtimes,
  showtimeSeats,
  seats,
  payments,
  tickets,
  auditLogs,
  users,
  movies,
  auditoriums,
  cinemas,
} from "@/db/schema";
import { eq, and, inArray, lt, sql } from "drizzle-orm";
import crypto from "crypto";

export interface CreateHoldParams {
  showtimeId: string;
  seatIds: string[];
  userId: string;
}

export interface ProcessPaymentParams {
  bookingId: string;
  idempotencyKey: string;
  provider?: string;
  simulateFailure?: boolean;
}

// Generate human-friendly cinema booking reference code
function generateReferenceCode(): string {
  const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `CB-${p1}-${p2}`;
}

export async function createBookingHold({
  showtimeId,
  seatIds,
  userId,
}: CreateHoldParams) {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("At least one seat must be selected");
  }

  // 1. Fetch showtime
  const [showtime] = await db
    .select()
    .from(showtimes)
    .where(eq(showtimes.id, showtimeId));

  if (!showtime) {
    throw new Error("Showtime not found");
  }

  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  // 2. Fetch requested showtime seats
  const requestedStSeats = await db
    .select()
    .from(showtimeSeats)
    .where(
      and(
        eq(showtimeSeats.showtimeId, showtimeId),
        inArray(showtimeSeats.seatId, seatIds)
      )
    );

  if (requestedStSeats.length !== seatIds.length) {
    throw new Error("One or more selected seats do not exist for this showtime");
  }

  // 3. Confirm every requested seat is available (or held by current user)
  for (const stSeat of requestedStSeats) {
    if (stSeat.status === "BOOKED") {
      throw new Error("One or more selected seats have already been booked");
    }
    if (stSeat.status === "BLOCKED") {
      throw new Error("One or more selected seats are unavailable for booking");
    }
    if (
      stSeat.status === "HELD" &&
      stSeat.holdExpiresAt &&
      new Date(stSeat.holdExpiresAt) > now &&
      stSeat.heldByUserId !== userId
    ) {
      throw new Error("One or more selected seats are currently held by another guest");
    }
  }

  // 4. Fetch seat details to compute tiered price
  const seatDetails = await db
    .select()
    .from(seats)
    .where(inArray(seats.id, seatIds));

  let subtotalCents = 0;
  const itemsToCreate: { seatId: string; showtimeSeatId: string; priceInCents: number }[] = [];

  for (const seat of seatDetails) {
    let seatPrice = showtime.priceInCents;
    if (seat.seatType === "VIP") {
      seatPrice += 400; // +$4.00 for VIP
    } else if (seat.seatType === "RECLINER") {
      seatPrice += 600; // +$6.00 for Luxury Recliner
    }

    subtotalCents += seatPrice;
    const matchingStSeat = requestedStSeats.find((s: any) => s.seatId === seat.id)!;
    itemsToCreate.push({
      seatId: seat.id,
      showtimeSeatId: matchingStSeat.id,
      priceInCents: seatPrice,
    });
  }

  // Calculate fees ($1.50 per ticket) and tax (8%)
  const feesCents = seatIds.length * 150;
  const taxCents = Math.round(subtotalCents * 0.08);
  const totalCents = subtotalCents + feesCents + taxCents;
  const referenceCode = generateReferenceCode();

  // 5. Atomic conditional reservation of seats
  // Attempt to atomically transition seats to HELD only if AVAILABLE or hold has expired
  const lockedSeatIds: string[] = [];
  for (const item of itemsToCreate) {
    const res = await db
      .update(showtimeSeats)
      .set({
        status: "HELD",
        holdExpiresAt,
        heldByUserId: userId,
        updatedAt: now,
      })
      .where(
        and(
          eq(showtimeSeats.id, item.showtimeSeatId),
          sql`(${showtimeSeats.status} = 'AVAILABLE' OR ${showtimeSeats.holdExpiresAt} < ${now.toISOString()} OR ${showtimeSeats.heldByUserId} = ${userId})`
        )
      )
      .returning();

    if (res.length === 0) {
      // Collision detected! Roll back any seats locked in this request
      if (lockedSeatIds.length > 0) {
        await db
          .update(showtimeSeats)
          .set({
            status: "AVAILABLE",
            holdExpiresAt: null,
            heldByUserId: null,
            updatedAt: now,
          })
          .where(inArray(showtimeSeats.id, lockedSeatIds));
      }
      throw new Error(
        "One or more selected seats were just reserved by another customer. Please select different seats."
      );
    }

    lockedSeatIds.push(item.showtimeSeatId);
  }

  // 6. Create pending booking
  const [newBooking] = await db
    .insert(bookings)
    .values({
      userId,
      showtimeId,
      referenceCode,
      status: "PENDING",
      subtotalCents,
      feesCents,
      taxCents,
      totalCents,
      expiresAt: holdExpiresAt,
    })
    .returning();

  // 7. Insert booking items
  await db.insert(bookingItems).values(
    itemsToCreate.map((item) => ({
      bookingId: newBooking.id,
      seatId: item.seatId,
      showtimeSeatId: item.showtimeSeatId,
      priceInCents: item.priceInCents,
    }))
  );

  // Link bookingId to the locked seats
  await db
    .update(showtimeSeats)
    .set({ bookingId: newBooking.id })
    .where(inArray(showtimeSeats.id, lockedSeatIds));

  // 8. Audit log
  await db.insert(auditLogs).values({
    userId,
    action: "BOOKING_HOLD_CREATED",
    entity: "bookings",
    entityId: newBooking.id,
    details: JSON.stringify({
      referenceCode,
      seatCount: seatIds.length,
      totalCents,
      expiresAt: holdExpiresAt.toISOString(),
    }),
  });

  return {
    booking: newBooking,
    items: itemsToCreate,
    expiresAt: holdExpiresAt,
  };
}

export async function processBookingPayment({
  bookingId,
  idempotencyKey,
  provider = "STRIPE_TEST",
  simulateFailure = false,
}: ProcessPaymentParams) {
  // 1. Check idempotency: if payment with same idempotency key exists, return it
  const [existingPayment] = await db
    .select()
    .from(payments)
    .where(eq(payments.idempotencyKey, idempotencyKey));

  if (existingPayment) {
    if (existingPayment.status === "SUCCEEDED") {
      const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
      const [t] = await db.select().from(tickets).where(eq(tickets.bookingId, bookingId));
      return {
        booking: b,
        payment: existingPayment,
        ticket: t,
        idempotentReplay: true,
      };
    }
  }

  // 2. Fetch booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status === "CONFIRMED") {
    const [t] = await db.select().from(tickets).where(eq(tickets.bookingId, bookingId));
    return { booking, ticket: t, idempotentReplay: true };
  }

  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") {
    throw new Error(`Cannot pay for a booking with status ${booking.status}`);
  }

  const now = new Date();
  if (new Date(booking.expiresAt) < now) {
    throw new Error("Seat hold has expired. Please reselect your seats.");
  }

  // 3. Verify held seats are still valid
  const heldSeats = await db
    .select()
    .from(showtimeSeats)
    .where(eq(showtimeSeats.bookingId, bookingId));

  for (const s of heldSeats) {
    if (s.status !== "HELD") {
      throw new Error("One or more seats in this booking are no longer held.");
    }
  }

  // 4. Handle failure simulation
  if (simulateFailure) {
    await db.insert(payments).values({
      bookingId,
      amountCents: booking.totalCents,
      status: "FAILED",
      provider,
      providerPaymentId: `ch_fail_${crypto.randomBytes(4).toString("hex")}`,
      idempotencyKey,
      metadata: JSON.stringify({ reason: "Simulated payment decline" }),
    });
    throw new Error("Card was declined by test payment provider");
  }

  // 5. Record successful payment
  const providerPaymentId = `ch_test_${crypto.randomBytes(6).toString("hex")}`;
  const [payment] = await db
    .insert(payments)
    .values({
      bookingId,
      amountCents: booking.totalCents,
      status: "SUCCEEDED",
      provider,
      providerPaymentId,
      idempotencyKey,
      metadata: JSON.stringify({ testMode: true, gateway: "CineBook-Mock-Stripe" }),
    })
    .returning();

  // 6. Confirm booking
  const [confirmedBooking] = await db
    .update(bookings)
    .set({
      status: "CONFIRMED",
      idempotencyKey,
      updatedAt: now,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  // 7. Update showtime seats to BOOKED
  await db
    .update(showtimeSeats)
    .set({
      status: "BOOKED",
      holdExpiresAt: null,
      updatedAt: now,
    })
    .where(eq(showtimeSeats.bookingId, bookingId));

  // 8. Generate Digital Ticket with QR payload
  const ticketCode = `TKT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const qrPayload = JSON.stringify({
    reference: booking.referenceCode,
    ticketCode,
    bookingId: booking.id,
    showtimeId: booking.showtimeId,
    verifiedAt: now.toISOString(),
  });

  const [ticket] = await db
    .insert(tickets)
    .values({
      bookingId: booking.id,
      ticketCode,
      qrPayload,
      isUsed: false,
    })
    .returning();

  // 9. Audit log
  await db.insert(auditLogs).values({
    userId: booking.userId,
    action: "PAYMENT_SUCCEEDED",
    entity: "bookings",
    entityId: booking.id,
    details: JSON.stringify({
      paymentId: payment.id,
      amountCents: payment.amountCents,
      ticketCode: ticket.ticketCode,
    }),
  });

  return {
    booking: confirmedBooking,
    payment,
    ticket,
    idempotentReplay: false,
  };
}

export async function cancelBooking(bookingId: string, userId: string, isAdmin = false) {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!isAdmin && booking.userId !== userId) {
    throw new Error("Unauthorized to cancel this booking");
  }

  if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
    return { booking, message: "Booking already cancelled" };
  }

  const newStatus = booking.status === "CONFIRMED" ? "REFUNDED" : "CANCELLED";
  const now = new Date();

  // 1. Release seats back to AVAILABLE
  await db
    .update(showtimeSeats)
    .set({
      status: "AVAILABLE",
      holdExpiresAt: null,
      heldByUserId: null,
      bookingId: null,
      updatedAt: now,
    })
    .where(eq(showtimeSeats.bookingId, bookingId));

  // 2. Update booking status
  const [updatedBooking] = await db
    .update(bookings)
    .set({
      status: newStatus,
      updatedAt: now,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  // 3. If refunded, update payment status
  if (newStatus === "REFUNDED") {
    await db
      .update(payments)
      .set({ status: "REFUNDED" })
      .where(eq(payments.bookingId, bookingId));
  }

  // 4. Audit log
  await db.insert(auditLogs).values({
    userId,
    action: "BOOKING_CANCELLED",
    entity: "bookings",
    entityId: bookingId,
    details: JSON.stringify({ newStatus, previousStatus: booking.status }),
  });

  return { booking: updatedBooking, message: "Booking successfully cancelled" };
}

export async function releaseExpiredHolds() {
  const now = new Date();

  // 1. Find all expired held showtime_seats
  const expiredSeats = await db
    .select()
    .from(showtimeSeats)
    .where(
      and(
        eq(showtimeSeats.status, "HELD"),
        lt(showtimeSeats.holdExpiresAt, now)
      )
    );

  if (expiredSeats.length === 0) {
    return { releasedSeatsCount: 0, expiredBookingsCount: 0 };
  }

  const bookingIdsToUpdate = new Set<string>();
  for (const s of expiredSeats) {
    if (s.bookingId) {
      bookingIdsToUpdate.add(s.bookingId);
    }
  }

  // 2. Reset expired seats to AVAILABLE
  const seatIds = (expiredSeats as any[]).map((s: any) => s.id);
  await db
    .update(showtimeSeats)
    .set({
      status: "AVAILABLE",
      holdExpiresAt: null,
      heldByUserId: null,
      bookingId: null,
      updatedAt: now,
    })
    .where(inArray(showtimeSeats.id, seatIds));

  // 3. Mark pending bookings as EXPIRED
  let expiredBookingsCount = 0;
  if (bookingIdsToUpdate.size > 0) {
    const res = await db
      .update(bookings)
      .set({
        status: "EXPIRED",
        updatedAt: now,
      })
      .where(
        and(
          inArray(bookings.id, Array.from(bookingIdsToUpdate)),
          eq(bookings.status, "PENDING")
        )
      )
      .returning();
    expiredBookingsCount = res.length;
  }

  // 4. Record audit log
  await db.insert(auditLogs).values({
    userId: null,
    action: "EXPIRED_HOLDS_RELEASED",
    entity: "showtime_seats",
    entityId: null,
    details: JSON.stringify({
      releasedSeatsCount: expiredSeats.length,
      expiredBookingsCount,
      timestamp: now.toISOString(),
    }),
  });

  return {
    releasedSeatsCount: expiredSeats.length,
    expiredBookingsCount,
  };
}
