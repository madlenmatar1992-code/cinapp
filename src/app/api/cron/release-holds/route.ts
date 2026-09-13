import { NextResponse } from "next/server";
import { releaseExpiredHolds } from "@/lib/booking-transaction";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  return handleRelease(req);
}

export async function GET(req: Request) {
  return handleRelease(req);
}

async function handleRelease(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const secretQuery = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET || "cinebook-cron-secret-2026";
    const bearerSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const isSecretValid =
      bearerSecret === expectedSecret || secretQuery === expectedSecret;

    // Alternatively allow signed-in admin
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.role === "ADMIN";

    if (!isSecretValid && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid CRON_SECRET or Admin credentials required" },
        { status: 401 }
      );
    }

    const result = await releaseExpiredHolds();

    return NextResponse.json({
      success: true,
      message: "Expired seat holds processed successfully",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Release holds error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to release expired holds" },
      { status: 500 }
    );
  }
}
