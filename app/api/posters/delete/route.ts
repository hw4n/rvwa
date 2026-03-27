import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { deletePosterObject } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getViewer();

  if (!viewer) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  if (viewer.role !== "admin") {
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      coverImageUrl?: string;
    };

    if (!body.coverImageUrl) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json(await deletePosterObject(body.coverImageUrl));
  } catch (caught) {
    return NextResponse.json(
      { message: caught instanceof Error ? caught.message : "Delete failed" },
      { status: 400 }
    );
  }
}
