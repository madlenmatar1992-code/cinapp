import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processBookingPayment } from "@/lib/booking-transaction";
import QRCode from "qrcode";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, idempotencyKey, simulateFailure } = body;

    if (!bookingId || !idempotencyKey) {
      return NextResponse.json(
        { error: "bookingId and idempotencyKey are required" },
        { status: 400 }
      );
    }

    const result = await processBookingPayment({
      bookingId,
      idempotencyKey,
      simulateFailure: Boolean(simulateFailure),
    });

    // Generate Base64 QR code data URL for instantaneous client rendering if ticket exists
    let qrDataUrl = "";
    if (result.ticket) {
      try {
        qrDataUrl = await QRCode.toDataURL(result.ticket.qrPayload, {
          width: 320,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        });
      } catch (err) {
        console.warn("QR generation warning:", err);
      }
    }

    return NextResponse.json({
      ...result,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error("Payment error:", error);
    const status =
      error.message.includes("declined") || error.message.includes("expired")
        ? 400
        : error.message.includes("conflict") || error.message.includes("held")
        ? 409
        : 500;

    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status }
    );
  }
}
