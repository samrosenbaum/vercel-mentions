import { NextResponse } from "next/server";
import { searchAllMentions } from "@/lib/exa";
import { createMentionsTable, insertMention } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure table exists
    await createMentionsTable();

    // Fetch mentions from Exa
    const mentions = await searchAllMentions();

    // Insert into database
    let inserted = 0;
    let updated = 0;

    for (const mention of mentions) {
      try {
        const result = await insertMention({
          platform: mention.platform,
          external_id: null,
          url: mention.url,
          title: mention.title,
          content: mention.text,
          author: mention.author,
          published_at: mention.publishedDate
            ? new Date(mention.publishedDate)
            : null,
          keyword: mention.keyword,
          score: mention.score,
          highlights: mention.highlights,
        });
        if (result) inserted++;
      } catch (err) {
        // ON CONFLICT means it was updated
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      fetched: mentions.length,
      inserted,
      updated,
    });
  } catch (error) {
    console.error("Cron fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentions", details: String(error) },
      { status: 500 }
    );
  }
}
