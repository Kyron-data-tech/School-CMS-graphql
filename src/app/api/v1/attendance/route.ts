import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";

// In-memory biometric log for demonstration
const biometricLogs: Array<{
  id: string;
  admissionNo: string;
  timestamp: string;
  terminal: string;
  status: "PRESENT" | "LATE";
}> = [
  {
    id: "bio_101",
    admissionNo: "ADM-2026-089",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    terminal: "Main Gate Biometric Scanner Terminal #1",
    status: "PRESENT",
  },
  {
    id: "bio_102",
    admissionNo: "ADM-2026-090",
    timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    terminal: "Main Gate Biometric Scanner Terminal #1",
    status: "PRESENT",
  },
];

export async function GET(req: Request) {
  const auth = validateApiKey(req, "attendance:read");
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    success: true,
    service: "Greenfield Institutional Attendance Service",
    authenticatedAs: auth.keyRecord?.name,
    recordsCount: biometricLogs.length,
    records: biometricLogs,
  });
}

export async function POST(req: Request) {
  const auth = validateApiKey(req, "attendance:write");
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { admissionNo, status = "PRESENT" } = body;

    if (!admissionNo) {
      return NextResponse.json({ error: "admissionNo is required." }, { status: 400 });
    }

    const logEntry = {
      id: `bio_${Date.now()}`,
      admissionNo: admissionNo.trim(),
      timestamp: new Date().toISOString(),
      terminal: auth.keyRecord?.name ?? "External API Terminal",
      status: (status.toUpperCase() === "LATE" ? "LATE" : "PRESENT") as "PRESENT" | "LATE",
    };

    biometricLogs.unshift(logEntry);

    return NextResponse.json({
      success: true,
      message: `Biometric attendance recorded for ${admissionNo}`,
      entry: logEntry,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to log attendance" }, { status: 500 });
  }
}
