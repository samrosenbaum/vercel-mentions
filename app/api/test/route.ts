import { NextResponse } from "next/server";
import { searchAllMentions } from "@/lib/exa";
import { searchHackerNews } from "@/lib/hackernews";
import { searchReddit } from "@/lib/reddit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    // Fetch from multiple sources in parallel
    const [exaMentions, hnMentions, redditMentions] = await Promise.all([
      searchAllMentions(),
      searchHackerNews(),
      searchReddit(),
    ]);

    // Transform Reddit results
    const redditFormatted = redditMentions.map((m, i) => ({
      id: 2000 + i,
      platform: "reddit",
      external_id: m.id,
      url: m.url,
      title: m.title,
      content: m.content,
      author: m.author,
      published_at: m.publishedDate,
      fetched_at: new Date().toISOString(),
      keyword: (m.title + m.content).toLowerCase().includes("v0") ? "v0" : "vercel",
      score: 0,
      highlights: m.content ? [m.content.slice(0, 200)] : [],
    }));

    // Transform Exa results
    const exaFormatted = exaMentions.map((m, i) => ({
      id: i + 1,
      platform: m.platform,
      external_id: null,
      url: m.url,
      title: m.title,
      content: m.text,
      author: m.author,
      published_at: m.publishedDate,
      fetched_at: new Date().toISOString(),
      keyword: m.keyword,
      score: m.score,
      highlights: m.highlights,
    }));

    // Transform HN results
    const hnFormatted = hnMentions.map((m, i) => ({
      id: 1000 + i,
      platform: "hackernews",
      external_id: m.id,
      url: m.url,
      title: m.title,
      content: m.content,
      author: m.author,
      published_at: m.publishedDate,
      fetched_at: new Date().toISOString(),
      keyword: m.title.toLowerCase().includes("v0") ? "v0" : "vercel",
      score: m.points / 100, // Normalize points
      highlights: m.content ? [m.content.slice(0, 200)] : [],
    }));

    // Combine all mentions
    const allMentions = [...exaFormatted, ...hnFormatted, ...redditFormatted];

    // Sort by date (newest first)
    allMentions.sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
      return dateB - dateA;
    });

    // Calculate stats
    const stats = {
      total: allMentions.length,
      byPlatform: Object.entries(
        allMentions.reduce((acc, m) => {
          acc[m.platform] = (acc[m.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
        .map(([platform, count]) => ({ platform, count: String(count) }))
        .sort((a, b) => parseInt(b.count) - parseInt(a.count)),
      byKeyword: Object.entries(
        allMentions.reduce((acc, m) => {
          acc[m.keyword] = (acc[m.keyword] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([keyword, count]) => ({ keyword, count: String(count) })),
    };

    return NextResponse.json({
      success: true,
      mentions: allMentions,
      stats,
      pagination: {
        limit: 100,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch mentions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
