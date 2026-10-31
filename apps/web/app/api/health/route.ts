import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "KIET Smart Care API",
    institution: "KIET Group of Institutions, Korangi, India",
    timestamp: new Date().toISOString(),
  });
}
