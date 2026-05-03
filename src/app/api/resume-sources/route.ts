import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      textLength?: number;
      parseStatus?: string;
      parseError?: string;
    };
    // Resume source logging is accepted but not persisted without commercial storage.
    return NextResponse.json({
      source: {
        id: crypto.randomUUID(),
        fileName: body.fileName || "resume.pdf",
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "RESUME_SOURCE_CREATE_FAILED" }, { status: 400 });
  }
}
