import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createBookingHold } from "@/lib/booking-transaction";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to book seats" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { showtimeId, seatIds } = body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "Valid showtimeId and seatIds array are required" },
        { status: 400 }
      );
    }

    const result = await createBookingHold({
      showtimeId,
      seatIds,
      userId: user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Booking hold creation error:", error);
    const status = error.message.includes("already") || error.message.includes("held") ? 409 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to create seat hold" },
      { status }
    );
  }
}
