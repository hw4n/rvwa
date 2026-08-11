import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { createPosterUpload, PosterUploadValidationError } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const viewer = await getViewer();

    if (!viewer) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    if (viewer.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 });
    }

    const body = (await request.json()) as {
      fileName?: string;
      contentType?: string;
      size?: number;
    };

    if (!body.fileName || !body.contentType || typeof body.size !== "number") {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json(await createPosterUpload(body as Required<typeof body>));
  } catch (caught) {
    if (caught instanceof SyntaxError || caught instanceof PosterUploadValidationError) {
      return NextResponse.json(
        { message: caught instanceof Error ? caught.message : "Invalid payload" },
        { status: 400 }
      );
    }

    console.error("Failed to prepare poster upload", caught);

    return NextResponse.json(
      { message: "Upload service is not configured or unavailable" },
      { status: 500 }
    );
  }
}
