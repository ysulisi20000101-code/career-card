import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { createResumeSource } from "@/lib/server/commercial-repository";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      textLength?: number;
      parseStatus?: "pending" | "succeeded" | "failed";
      parseError?: string;
    };
    const source = await createResumeSource({
      userId: user.id,
      fileName: body.fileName || "resume.pdf",
      fileSize: Number(body.fileSize ?? 0),
      fileType: body.fileType || "application/pdf",
      textLength: Number(body.textLength ?? 0),
      parseStatus: body.parseStatus ?? "succeeded",
      parseError: body.parseError,
    });
    return NextResponse.json({ source });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: "RESUME_SOURCE_CREATE_FAILED" }, { status });
  }
}
