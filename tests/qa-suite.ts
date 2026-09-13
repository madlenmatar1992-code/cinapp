import { db } from "../src/db";
import {
  users,
  movies,
  showtimes,
  showtimeSeats,
  seats,
  bookings,
  tickets,
  payments,
} from "../src/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  createBookingHold,
  processBookingPayment,
  cancelBooking,
  releaseExpiredHolds,
} from "../src/lib/booking-transaction";
import { createSessionToken, verifySessionToken } from "../src/lib/auth";

async function runQASuite() {
  console.log("=================================================");
  console.log("  🎬 CINEBOOK COMPREHENSIVE QA VERIFICATION SUITE ");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Database Seed & Integrity Check
    // -------------------------------------------------------------
    console.log("--- TEST 1: Database Integrity & Seeded Entities ---");
    const allMovies = await db.select().from(movies);
    assert(allMovies.length >= 6, `Catalog contains ${allMovies.length} movies (expected >= 6)`);

    const allShowtimes = await db.select().from(showtimes);
    assert(allShowtimes.length >= 10, `Database contains ${allShowtimes.length} scheduled showtimes`);

    const [admin] = await db.select().from(users).where(eq(users.role, "ADMIN"));
    assert(!!admin, "Admin user exists in database");

    const [customer] = await db.select().from(users).where(eq(users.role, "USER"));
    assert(!!customer, "Standard customer user exists in database");

    // -------------------------------------------------------------
    // TEST 2: Authentication & Password Security
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Auth, Bcrypt Hashing, and JWT Sessions ---");
    const isPasswordValid = await bcrypt.compare("AdminPass123!", admin.passwordHash);
    assert(isPasswordValid, "Admin password hash matches plaintext correctly");

    const isWrongPassword = await bcrypt.compare("WrongPassword", admin.passwordHash);
    assert(!isWrongPassword, "Invalid password rejected by bcrypt comparison");

    const token = await createSessionToken({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      role: customer.role as "USER",
    });
    assert(typeof token === "string" && token.length > 20, "JWT session token created successfully");

    const sessionPayload = await verifySessionToken(token);
    assert(sessionPayload?.email === customer.email, "Session token verified and payload intact");

    // -------------------------------------------------------------
    // TEST 3: Pricing Calculation & Server-Side Rules
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Server-Side Pricing, Fees, & Minor Units ---");
    const testShowtime = allShowtimes[0];
    const audSeats = await db
      .select()
      .from(seats)
      .where(eq(seats.auditoriumId, testShowtime.auditoriumId))
      .limit(3);

    assert(audSeats.length === 3, "Fetched 3 test seats from auditorium");

    // Create seat hold
    const holdResult = await createBookingHold({
      showtimeId: testShowtime.id,
      seatIds: audSeats.map((s) => s.id),
      userId: customer.id,
    });

    const expectedSubtotal = holdResult.items.reduce((acc, i) => acc + i.priceInCents, 0);
    const expectedFees = 3 * 150; // $1.50 per seat = 450 cents
    const expectedTax = Math.round(expectedSubtotal * 0.08);
    const expectedTotal = expectedSubtotal + expectedFees + expectedTax;

    assert(holdResult.booking.subtotalCents === expectedSubtotal, `Subtotal cents calculated: ${expectedSubtotal}`);
    assert(holdResult.booking.feesCents === expectedFees, `Convenience fees cents calculated: ${expectedFees}`);
    assert(holdResult.booking.taxCents === expectedTax, `Tax cents calculated: ${expectedTax}`);
    assert(holdResult.booking.totalCents === expectedTotal, `Total minor units matched: ${expectedTotal}`);
    assert(holdResult.booking.status === "PENDING", "Booking status set to PENDING");

    // Verify seats transitioned to HELD in database
    const heldSeats = await db
      .select()
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.showtimeId, testShowtime.id),
          inArray(showtimeSeats.seatId, audSeats.map((s) => s.id))
        )
      );

    assert(heldSeats.every((s) => s.status === "HELD"), "All 3 seats transitioned to HELD status");
    assert(heldSeats.every((s) => s.heldByUserId === customer.id), "Held seats assigned to customer");

    // -------------------------------------------------------------
    // TEST 4: Concurrency Collision & Double-Booking Prevention
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Concurrency & Double-Booking Collision Test ---");
    // Pick another available seat in showtime
    const otherSeats = await db
      .select()
      .from(seats)
      .where(eq(seats.auditoriumId, testShowtime.auditoriumId));

    const availableSeat = otherSeats.find((s) => !audSeats.map((x) => x.id).includes(s.id))!;

    // Make sure it's AVAILABLE
    await db
      .update(showtimeSeats)
      .set({ status: "AVAILABLE", holdExpiresAt: null, heldByUserId: null, bookingId: null })
      .where(
        and(
          eq(showtimeSeats.showtimeId, testShowtime.id),
          eq(showtimeSeats.seatId, availableSeat.id)
        )
      );

    // Two users simultaneously attempt to hold the EXACT same seat at the exact same millisecond
    let user1Success = false;
    let user2Success = false;

    const results = await Promise.allSettled([
      createBookingHold({
        showtimeId: testShowtime.id,
        seatIds: [availableSeat.id],
        userId: customer.id,
      }),
      createBookingHold({
        showtimeId: testShowtime.id,
        seatIds: [availableSeat.id],
        userId: admin.id,
      }),
    ]);

    if (results[0].status === "fulfilled") user1Success = true;
    if (results[1].status === "fulfilled") user2Success = true;

    // Exactly one must succeed, and exactly one must fail with rejection!
    assert(
      (user1Success && !user2Success) || (!user1Success && user2Success),
      "Exactly one concurrent user successfully acquired the seat hold, while the other was rejected!"
    );

    // -------------------------------------------------------------
    // TEST 5: Payment Processing, Confirmation, & QR Ticket Generation
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Payment Processing & QR Digital Ticket Generation ---");
    const idempotencyKey = `qa_idemp_${Date.now()}`;
    const paymentResult = await processBookingPayment({
      bookingId: holdResult.booking.id,
      idempotencyKey,
      simulateFailure: false,
    });

    assert(paymentResult.booking.status === "CONFIRMED", "Booking status transitioned to CONFIRMED");
    assert(paymentResult.payment.status === "SUCCEEDED", "Payment status transitioned to SUCCEEDED");
    assert(!!paymentResult.ticket, "Digital ticket successfully issued");
    assert(paymentResult.ticket.ticketCode.startsWith("TKT-"), "Ticket has valid format code");

    const qrPayload = JSON.parse(paymentResult.ticket.qrPayload);
    assert(qrPayload.reference === holdResult.booking.referenceCode, "QR payload embeds correct booking reference");
    assert(qrPayload.ticketCode === paymentResult.ticket.ticketCode, "QR payload embeds matching ticket code");

    // Verify seats transitioned to BOOKED in DB
    const bookedSeats = await db
      .select()
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.showtimeId, testShowtime.id),
          inArray(showtimeSeats.seatId, audSeats.map((s) => s.id))
        )
      );
    assert(bookedSeats.every((s) => s.status === "BOOKED"), "Showtime seats transitioned to BOOKED status");

    // -------------------------------------------------------------
    // TEST 6: Payment Idempotency Guard
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Payment Idempotency Guard ---");
    const replayPaymentResult = await processBookingPayment({
      bookingId: holdResult.booking.id,
      idempotencyKey, // Replaying the exact same idempotency key
    });

    assert(replayPaymentResult.idempotentReplay === true, "Idempotent payment replay detected and handled gracefully");
    assert(replayPaymentResult.booking.id === holdResult.booking.id, "Returned existing confirmed booking without duplicate transaction");

    // -------------------------------------------------------------
    // TEST 7: Payment Failure Simulation
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Payment Failure Simulation ---");
    // Create a new hold for failure testing
    const failTestSeat = otherSeats.find(
      (s) => s.id !== availableSeat.id && !audSeats.map((x) => x.id).includes(s.id)
    )!;

    const failHold = await createBookingHold({
      showtimeId: testShowtime.id,
      seatIds: [failTestSeat.id],
      userId: customer.id,
    });

    let paymentFailedGracefully = false;
    try {
      await processBookingPayment({
        bookingId: failHold.booking.id,
        idempotencyKey: `fail_idemp_${Date.now()}`,
        simulateFailure: true,
      });
    } catch (err: any) {
      paymentFailedGracefully = err.message.includes("declined");
    }

    assert(paymentFailedGracefully, "Simulated card decline threw descriptive error and preserved integrity");

    // -------------------------------------------------------------
    // TEST 8: Expired Holds Automatic Release Routine
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Expired Holds Cleanup Routine ---");
    // Manually backdate the hold expiration time to 15 minutes ago
    const pastTime = new Date(Date.now() - 15 * 60 * 1000);
    await db
      .update(showtimeSeats)
      .set({ holdExpiresAt: pastTime })
      .where(
        and(
          eq(showtimeSeats.showtimeId, testShowtime.id),
          eq(showtimeSeats.seatId, failTestSeat.id)
        )
      );

    await db
      .update(bookings)
      .set({ expiresAt: pastTime })
      .where(eq(bookings.id, failHold.booking.id));

    // Execute releaseExpiredHolds
    const releaseResult = await releaseExpiredHolds();
    assert(releaseResult.releasedSeatsCount >= 1, `Released ${releaseResult.releasedSeatsCount} expired seats back to pool`);

    // Verify seat is now AVAILABLE again
    const [releasedSeat] = await db
      .select()
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.showtimeId, testShowtime.id),
          eq(showtimeSeats.seatId, failTestSeat.id)
        )
      );
    assert(releasedSeat.status === "AVAILABLE", "Expired held seat returned to AVAILABLE status");

    // -------------------------------------------------------------
    // TEST 9: Booking Cancellation & Seat Re-pooling
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: Booking Cancellation & Seat Re-pooling ---");
    const cancelResult = await cancelBooking(holdResult.booking.id, customer.id, false);
    assert(cancelResult.booking.status === "REFUNDED", "Confirmed booking status set to REFUNDED");

    // Verify seats returned to AVAILABLE
    const releasedSeatsAfterCancel = await db
      .select()
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.showtimeId, testShowtime.id),
          inArray(showtimeSeats.seatId, audSeats.map((s) => s.id))
        )
      );
    assert(
      releasedSeatsAfterCancel.every((s) => s.status === "AVAILABLE"),
      "Cancelled booking released all showtime seats back to AVAILABLE for other patrons"
    );

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n=================================================");
    console.log(`  🎉 ALL QA TESTS PASSED! (${passedTests} / ${totalTests})`);
    console.log("=================================================\n");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ QA Test Suite Failure:", error);
    process.exit(1);
  }
}

runQASuite();
