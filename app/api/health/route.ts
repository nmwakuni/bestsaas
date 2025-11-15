import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health check endpoint for container orchestration and monitoring
 * Returns 200 if the application and database are healthy
 */
export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        service: "school-management-system",
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        service: "school-management-system",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
