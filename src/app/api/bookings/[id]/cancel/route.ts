import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelBooking } from "@/lib/booking-transaction";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cancelBooking(id, user.id, user.role === "ADMIN");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    const status = error.message.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status }
    );
  }
}
