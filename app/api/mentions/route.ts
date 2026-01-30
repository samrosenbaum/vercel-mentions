import { NextResponse } from "next/server";
import { getMentions, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? undefined;
  const keyword = searchParams.get("keyword") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  try {
    const [mentions, stats] = await Promise.all([
      getMentions({ platform, keyword, limit, offset }),
      getStats(),
    ]);

    return NextResponse.json({
      mentions,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: mentions.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentions", details: String(error) },
      { status: 500 }
    );
  }
}
