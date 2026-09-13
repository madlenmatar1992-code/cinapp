import { NextResponse } from "next/server";
import { db } from "@/db";
import { cinemas, auditoriums } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allCinemas = await db
      .select()
      .from(cinemas)
      .where(eq(cinemas.isActive, true));

    const allAuditoriums = await db.select().from(auditoriums);

    const result = allCinemas.map((c: any) => ({
      ...c,
      auditoriums: allAuditoriums.filter((a: any) => a.cinemaId === c.id),
    }));

    return NextResponse.json({ cinemas: result });
  } catch (error: any) {
    console.error("Cinemas error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cinemas" },
      { status: 500 }
    );
  }
}
